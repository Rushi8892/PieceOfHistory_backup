import { and, eq, lte } from "drizzle-orm";
import { db, dailyPiecesTable, pool } from "@workspace/db";
import { closeDailyPiece } from "../src/lib/day-close";

const now = new Date();

try {
  const [dueDay] = await db
    .select({ id: dailyPiecesTable.id })
    .from(dailyPiecesTable)
    .where(
      and(
        eq(dailyPiecesTable.status, "active"),
        lte(dailyPiecesTable.closingTimestamp, now),
      ),
    )
    .limit(1);

  const result = dueDay ? await closeDailyPiece(db, dueDay.id, now) : null;
  process.stdout.write(`${JSON.stringify({ acted: Boolean(result), result })}\n`);
} finally {
  await pool.end();
}