import { count, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { db, dailyPiecesTable, usersTable } from "@workspace/db";
import { GetSiteStatsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/stats", async (req, res): Promise<void> => {
  const [userCount, dayCount, closedDayCount] = await Promise.all([
    db.select({ count: count() }).from(usersTable),
    db.select({ count: count() }).from(dailyPiecesTable),
    db
      .select({ count: count() })
      .from(dailyPiecesTable)
      .where(eq(dailyPiecesTable.status, "closed")),
  ]);

  const data = GetSiteStatsResponse.parse({
    users: Number(userCount[0]?.count ?? 0),
    daysLaunched: Number(dayCount[0]?.count ?? 0),
    piecesOfHistory: Number(closedDayCount[0]?.count ?? 0),
  });

  req.log.debug({ data }, "Loaded public site stats");
  res.json(data);
});

export default router;