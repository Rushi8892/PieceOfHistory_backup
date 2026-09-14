import { and, asc, desc, eq, max, sql, sum } from "drizzle-orm";
import {
  bidsTable,
  dailyPiecesTable,
  participantStandingsTable,
  paymentOrdersTable,
  storiesTable,
} from "@workspace/db";

export type CapturedPayment = {
  orderId: string;
  paymentId: string;
  amountCents: number;
  currency: string;
  capturedAt: Date;
};

export function isPaymentAmountAllowed(
  amountCents: number,
  minimumPaymentCents: number,
): boolean {
  return (
    Number.isInteger(amountCents) &&
    amountCents > 0 &&
    amountCents >= minimumPaymentCents
  );
}

/**
 * Settle one captured payment. The DailyPiece lock is deliberately acquired
 * before any standings are read or changed: this is the serialization boundary
 * for concurrent webhook deliveries.
 */
export async function settleCapturedPayment(
  transactionDatabase: any,
  payment: CapturedPayment,
): Promise<"captured" | "replayed" | "ignored" | "unknown_order"> {
  return transactionDatabase.transaction(async (tx: any) => {
    const [storedOrder] = await tx
      .select()
      .from(paymentOrdersTable)
      .where(eq(paymentOrdersTable.razorpayOrderId, payment.orderId))
      .limit(1)
      .for("update");

    if (!storedOrder) return "unknown_order";

    const [dailyPiece] = await tx
      .select()
      .from(dailyPiecesTable)
      .where(eq(dailyPiecesTable.id, storedOrder.dailyPieceId))
      .limit(1)
      .for("update");

    if (
      !dailyPiece ||
      dailyPiece.status !== "active" ||
      Number.isNaN(payment.capturedAt.getTime()) ||
      payment.capturedAt > dailyPiece.closingTimestamp ||
      storedOrder.currency !== "USD" ||
      !isPaymentAmountAllowed(
        storedOrder.amountCents,
        dailyPiece.minimumPaymentCents,
      ) ||
      storedOrder.amountCents !== payment.amountCents ||
      payment.currency !== "USD"
    ) {
      return "ignored";
    }

    if (storedOrder.razorpayPaymentId) {
      return storedOrder.razorpayPaymentId === payment.paymentId
        ? "replayed"
        : "ignored";
    }

    const [existingBid] = await tx
      .select({ id: bidsTable.id })
      .from(bidsTable)
      .where(eq(bidsTable.paymentReference, payment.paymentId))
      .limit(1);
    if (existingBid) return "replayed";

    const [story] = await tx
      .select()
      .from(storiesTable)
      .where(
        and(
          eq(storiesTable.id, storedOrder.storyId),
          eq(storiesTable.userId, storedOrder.userId),
          eq(storiesTable.dailyPieceId, storedOrder.dailyPieceId),
        ),
      )
      .limit(1);
    if (!story) return "ignored";

    await tx
      .update(paymentOrdersTable)
      .set({
        razorpayPaymentId: payment.paymentId,
        status: "captured",
        capturedAt: payment.capturedAt,
      })
      .where(eq(paymentOrdersTable.id, storedOrder.id));

    await tx.insert(bidsTable).values({
      userId: storedOrder.userId,
      dailyPieceId: storedOrder.dailyPieceId,
      amountCents: payment.amountCents,
      paymentReference: payment.paymentId,
      paymentOrderId: storedOrder.id,
      paymentStatus: "captured",
      capturedAt: payment.capturedAt,
    });

    const [capturedSummary] = await tx
      .select({
        total: sum(bidsTable.amountCents),
        latestCapturedAt: max(bidsTable.capturedAt),
      })
      .from(bidsTable)
      .where(
        and(
          eq(bidsTable.userId, storedOrder.userId),
          eq(bidsTable.dailyPieceId, storedOrder.dailyPieceId),
          eq(bidsTable.paymentStatus, "captured"),
        ),
      );
    const runningTotal = Number(capturedSummary?.total ?? 0);
    const standingAt = capturedSummary?.latestCapturedAt ?? payment.capturedAt;

    await tx
      .insert(participantStandingsTable)
      .values({
        userId: storedOrder.userId,
        dailyPieceId: storedOrder.dailyPieceId,
        runningTotalCents: runningTotal,
        lastPaymentAt: standingAt,
        standingReachedAt: standingAt,
      })
      .onConflictDoUpdate({
        target: [
          participantStandingsTable.userId,
          participantStandingsTable.dailyPieceId,
        ],
        set: {
          runningTotalCents: runningTotal,
          lastPaymentAt: standingAt,
          standingReachedAt: standingAt,
        },
      });

    await tx
      .update(storiesTable)
      .set({ status: "visible", updatedAt: payment.capturedAt })
      .where(
        and(
          eq(storiesTable.id, story.id),
          eq(storiesTable.status, "hidden"),
        ),
      );

    const standings = await tx
      .select()
      .from(participantStandingsTable)
      .where(eq(participantStandingsTable.dailyPieceId, storedOrder.dailyPieceId))
      .orderBy(
        desc(participantStandingsTable.runningTotalCents),
        sql`${participantStandingsTable.standingReachedAt} asc nulls last`,
        asc(participantStandingsTable.userId),
      );
    const leader = standings[0];
    await tx
      .update(dailyPiecesTable)
      .set({
        winnerUserId: leader?.userId ?? null,
        winningStandingCents: leader?.runningTotalCents ?? null,
      })
      .where(eq(dailyPiecesTable.id, storedOrder.dailyPieceId));

    return "captured";
  });
}