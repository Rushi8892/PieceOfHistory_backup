import { and, eq } from "drizzle-orm";
import { paymentOrdersTable } from "@workspace/db";
import type { DailyPiece } from "@workspace/db";
import { settleCapturedPayment } from "./payment-settlement";
import { createRazorpayClient, type RazorpayClient } from "./razorpay";

export async function reconcilePendingPaymentsForDay(
  database: any,
  day: Pick<DailyPiece, "id" | "closingTimestamp">,
  clientFactory: () => RazorpayClient = createRazorpayClient,
): Promise<void> {
  const pendingOrders = await database
    .select({ razorpayOrderId: paymentOrdersTable.razorpayOrderId })
    .from(paymentOrdersTable)
    .where(
      and(
        eq(paymentOrdersTable.dailyPieceId, day.id),
        eq(paymentOrdersTable.status, "pending"),
      ),
    );
  if (pendingOrders.length === 0) return;

  const client = clientFactory();
  if (!client.fetchCapturedPayments) {
    throw new Error("Razorpay payment reconciliation is not configured.");
  }

  for (const order of pendingOrders) {
    const capturedPayments = await client.fetchCapturedPayments(
      order.razorpayOrderId,
    );
    for (const payment of capturedPayments) {
      if (payment.orderId !== order.razorpayOrderId) {
        throw new Error("Razorpay returned a payment for a different order.");
      }

      // A capture after the competition deadline cannot affect its winner.
      if (payment.capturedAt > day.closingTimestamp) continue;
      const result = await settleCapturedPayment(database, payment);
      if (result !== "captured" && result !== "replayed") {
        throw new Error(
          "A pre-deadline Razorpay capture could not be reconciled.",
        );
      }
    }
  }
}