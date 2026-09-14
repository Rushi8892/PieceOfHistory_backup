import { and, asc, desc, eq, sql } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  db,
  dailyPiecesTable,
  participantStandingsTable,
  storiesTable,
} from "@workspace/db";
import { GetTodayCompetitionResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/competition/today", async (req, res): Promise<void> => {
  const [activeDay] = await db
    .select()
    .from(dailyPiecesTable)
    .where(eq(dailyPiecesTable.status, "active"))
    .limit(1);

  if (!activeDay) {
    res.status(404).json({ error: "There is no active competition." });
    return;
  }

  const participants = await db
    .select({
      id: storiesTable.id,
      displayName: storiesTable.displayName,
      story: storiesTable.storyText,
      websiteUrl: storiesTable.websiteUrl,
      runningTotalCents: participantStandingsTable.runningTotalCents,
      standingReachedAt: participantStandingsTable.standingReachedAt,
    })
    .from(participantStandingsTable)
    .innerJoin(
      storiesTable,
      and(
        eq(participantStandingsTable.userId, storiesTable.userId),
        eq(participantStandingsTable.dailyPieceId, storiesTable.dailyPieceId),
      ),
    )
    .where(
      and(
        eq(participantStandingsTable.dailyPieceId, activeDay.id),
        eq(storiesTable.status, "visible"),
      ),
    )
    .orderBy(
      desc(participantStandingsTable.runningTotalCents),
      sql`${participantStandingsTable.standingReachedAt} asc nulls last`,
      asc(storiesTable.id),
    );

  const data = GetTodayCompetitionResponse.parse({
    id: activeDay.id,
    date: activeDay.date,
    serverTime: new Date(),
    closingTimestamp: activeDay.closingTimestamp,
    minimumPaymentCents: activeDay.minimumPaymentCents,
    participants: participants.map(
      ({ standingReachedAt: _standingReachedAt, ...participant }, index) => ({
        ...participant,
        websiteUrl: participant.websiteUrl ?? null,
        rank: index + 1,
      }),
    ),
  });

  req.log.debug(
    { dailyPieceId: activeDay.id, participantCount: data.participants.length },
    "Loaded today's competition",
  );
  res.json(data);
});

export default router;