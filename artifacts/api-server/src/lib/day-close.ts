import { asc, desc, eq, sql } from "drizzle-orm";
import {
  dailyPiecesTable,
  participantStandingsTable,
} from "@workspace/db";

export type ClosedDayResult = {
  dailyPieceId: string;
  date: string;
  winnerUserId: string | null;
  winningStandingCents: number | null;
  closedAt: Date;
  nextDailyPieceId: string;
  nextDate: string;
};

function nextDate(date: string): string {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
}

export async function closeDailyPiece(
  database: any,
  dailyPieceId: string,
  now = new Date(),
): Promise<ClosedDayResult | null> {
  return database.transaction(async (tx: any) => {
    const [day] = await tx
      .select()
      .from(dailyPiecesTable)
      .where(eq(dailyPiecesTable.id, dailyPieceId))
      .limit(1)
      .for("update");

    if (!day) return null;
    const tomorrow = nextDate(day.date);

    if (day.status === "closed") {
      const [existingNext] = await tx
        .select()
        .from(dailyPiecesTable)
        .where(eq(dailyPiecesTable.date, tomorrow))
        .limit(1);
      if (!day.closedAt || !existingNext) return null;
      return {
        dailyPieceId: day.id,
        date: day.date,
        winnerUserId: day.winnerUserId,
        winningStandingCents: day.winningStandingCents,
        closedAt: day.closedAt,
        nextDailyPieceId: existingNext.id,
        nextDate: existingNext.date,
      };
    }

    if (day.closingTimestamp > now) return null;

    const [leader] = await tx
      .select()
      .from(participantStandingsTable)
      .where(eq(participantStandingsTable.dailyPieceId, day.id))
      .orderBy(
        desc(participantStandingsTable.runningTotalCents),
        sql`${participantStandingsTable.standingReachedAt} asc nulls last`,
        asc(participantStandingsTable.userId),
      )
      .limit(1);

    const closedAt = now;
    await tx
      .update(dailyPiecesTable)
      .set({
        status: "closed",
        winnerUserId: leader?.userId ?? null,
        winningStandingCents: leader?.runningTotalCents ?? null,
        closedAt,
      })
      .where(eq(dailyPiecesTable.id, day.id));

    const nextClosingTimestamp = new Date(
      day.closingTimestamp.getTime() + 24 * 60 * 60 * 1000,
    );
    await tx
      .insert(dailyPiecesTable)
      .values({
        date: tomorrow,
        closingTimestamp: nextClosingTimestamp,
        status: "active",
        minimumPaymentCents: day.minimumPaymentCents,
      })
      .onConflictDoNothing({ target: dailyPiecesTable.date });

    const [createdNext] = await tx
      .select()
      .from(dailyPiecesTable)
      .where(eq(dailyPiecesTable.date, tomorrow))
      .limit(1);
    if (!createdNext || createdNext.status !== "active") {
      throw new Error("Tomorrow's active DailyPiece could not be created.");
    }

    return {
      dailyPieceId: day.id,
      date: day.date,
      winnerUserId: leader?.userId ?? null,
      winningStandingCents: leader?.runningTotalCents ?? null,
      closedAt,
      nextDailyPieceId: createdNext.id,
      nextDate: createdNext.date,
    };
  });
}