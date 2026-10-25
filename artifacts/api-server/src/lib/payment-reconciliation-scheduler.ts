import { eq } from "drizzle-orm";
import { dailyPiecesTable, db, pool } from "@workspace/db";
import { advanceOverdueDailyPieces } from "./day-close";
import { logger } from "./logger";
import { reconcilePendingPaymentsForDay } from "./reconcile-pending-payments";

const RECONCILIATION_INTERVAL_MS = 2 * 60 * 1000;
const PAYMENT_GRACE_PERIOD_MS = 60 * 1000;
const SCHEDULER_LOCK_NAMESPACE = 734218;
const SCHEDULER_LOCK_ID = 1;

let reconciliationRunning = false;

async function reconcilePendingPayments(): Promise<void> {
  if (reconciliationRunning) return;
  reconciliationRunning = true;

  try {
    const lockClient = await pool.connect();
    let hasDatabaseLock = false;
    try {
      const lockResult = await lockClient.query(
        "SELECT pg_try_advisory_lock($1, $2) AS locked",
        [SCHEDULER_LOCK_NAMESPACE, SCHEDULER_LOCK_ID],
      );
      hasDatabaseLock = Boolean(lockResult.rows[0]?.locked);
      if (!hasDatabaseLock) return;

      const now = new Date();
      const [activeDay] = await db
        .select()
        .from(dailyPiecesTable)
        .where(eq(dailyPiecesTable.status, "active"))
        .limit(1);

      if (activeDay) {
        await reconcilePendingPaymentsForDay(
          db,
          activeDay,
          undefined,
          new Date(now.getTime() - PAYMENT_GRACE_PERIOD_MS),
        );
      }

      // If a day is overdue, reconcile every remaining order (including those
      // still inside the grace period) before it is closed and rolled over.
      await advanceOverdueDailyPieces(db, now, (day) =>
        reconcilePendingPaymentsForDay(db, day),
      );
    } finally {
      if (hasDatabaseLock) {
        try {
          await lockClient.query("SELECT pg_advisory_unlock($1, $2)", [
            SCHEDULER_LOCK_NAMESPACE,
            SCHEDULER_LOCK_ID,
          ]);
        } catch (error) {
          logger.error({ err: error }, "Could not release payment scheduler lock");
        }
      }
      lockClient.release();
    }
  } catch (error) {
    logger.error({ err: error }, "Scheduled payment reconciliation failed");
  } finally {
    reconciliationRunning = false;
  }
}

export function startPaymentReconciliationScheduler(): void {
  const run = () => {
    void reconcilePendingPayments();
  };

  run();
  const timer = setInterval(run, RECONCILIATION_INTERVAL_MS);
  timer.unref();
}
