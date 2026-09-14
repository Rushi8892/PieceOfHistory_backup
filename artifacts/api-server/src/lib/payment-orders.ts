import { randomUUID } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import {
  dailyPiecesTable,
  paymentOrdersTable,
  storiesTable,
} from "@workspace/db";
import { isPaymentAmountAllowed } from "./payment-settlement";
import type { RazorpayClient } from "./razorpay";

export class PaymentOrderError extends Error {
  constructor(
    readonly statusCode: 404 | 409,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Creates and persists a server-owned order. The Razorpay adapter is passed
 * in so this boundary can be tested without network access.
 */
export async function createPaymentOrderForStory(
  database: any,
  input: {
    userId: string;
    storyId: string;
    amountCents: number;
  },
  razorpayClient: RazorpayClient,
  keyId: string,
): Promise<{ orderId: string; amountCents: number; currency: "USD"; keyId: string }> {
  const now = new Date();
  const [story] = await database
    .select()
    .from(storiesTable)
    .where(
      and(
        eq(storiesTable.id, input.storyId),
        eq(storiesTable.userId, input.userId),
      ),
    )
    .limit(1);
  if (!story) throw new PaymentOrderError(404, "Story not found.");

  const [day] = await database
    .select()
    .from(dailyPiecesTable)
    .where(
      and(
        eq(dailyPiecesTable.id, story.dailyPieceId),
        eq(dailyPiecesTable.status, "active"),
        gt(dailyPiecesTable.closingTimestamp, now),
      ),
    )
    .limit(1);
  if (!day) {
    throw new PaymentOrderError(409, "This piece is no longer payable.");
  }
  if (
    (story.status !== "hidden" && story.status !== "visible") ||
    !isPaymentAmountAllowed(input.amountCents, day.minimumPaymentCents)
  ) {
    throw new PaymentOrderError(
      409,
      `Payment must be at least ${day.minimumPaymentCents} cents.`,
    );
  }

  const razorpayOrder = await razorpayClient.createOrder({
    amountCents: input.amountCents,
    receipt: `poh-${randomUUID().replaceAll("-", "")}`,
  });
  await database.insert(paymentOrdersTable).values({
    storyId: story.id,
    userId: input.userId,
    dailyPieceId: day.id,
    razorpayOrderId: razorpayOrder.id,
    amountCents: input.amountCents,
    currency: "USD",
    keyId,
    status: "pending",
  });
  return {
    orderId: razorpayOrder.id,
    amountCents: razorpayOrder.amount,
    currency: "USD",
    keyId,
  };
}