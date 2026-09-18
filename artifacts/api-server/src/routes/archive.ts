import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  isNotNull,
} from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  GetArchiveDetailParams,
  GetArchiveDetailResponse,
  GetArchiveQueryParams,
  GetArchiveResponse,
  GetMyHistoryQueryParams,
  GetMyHistoryResponse,
} from "@workspace/api-zod";
import {
  bidsTable,
  db,
  dailyPiecesTable,
  participantStandingsTable,
  storiesTable,
  usersTable,
} from "@workspace/db";
import { getAuthenticatedLocalUser } from "../lib/authenticated-user";

const router: IRouter = Router();
const ISO_CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function parseArchiveDate(
  rawDate: string | string[] | undefined,
): string | null {
  const date = Array.isArray(rawDate) ? rawDate[0] : rawDate;
  if (!date || !ISO_CALENDAR_DATE.test(date)) {
    return null;
  }

  const dateValue = new Date(`${date}T00:00:00.000Z`);
  if (
    Number.isNaN(dateValue.getTime()) ||
    dateValue.toISOString().slice(0, 10) !== date
  ) {
    return null;
  }

  const parsed = GetArchiveDetailParams.safeParse({ date: dateValue });
  return parsed.success ? parsed.data.date.toISOString().slice(0, 10) : null;
}

function pagination(total: number, page: number, pageSize: number) {
  return {
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

router.get("/archive", async (req, res): Promise<void> => {
  const parsed = GetArchiveQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { page, pageSize } = parsed.data;
  const offset = (page - 1) * pageSize;

  const [totalRow] = await db
    .select({ total: count() })
    .from(dailyPiecesTable)
    .where(eq(dailyPiecesTable.status, "closed"));
  const rows = await db
    .select({
      id: dailyPiecesTable.id,
      date: dailyPiecesTable.date,
      winnerDisplayName: storiesTable.displayName,
      winningStandingCents: dailyPiecesTable.winningStandingCents,
      participantCount: count(participantStandingsTable.userId),
    })
    .from(dailyPiecesTable)
    .leftJoin(
      storiesTable,
      and(
        eq(storiesTable.userId, dailyPiecesTable.winnerUserId),
        eq(storiesTable.dailyPieceId, dailyPiecesTable.id),
        eq(storiesTable.status, "visible"),
      ),
    )
    .leftJoin(
      participantStandingsTable,
      eq(participantStandingsTable.dailyPieceId, dailyPiecesTable.id),
    )
    .where(eq(dailyPiecesTable.status, "closed"))
    .groupBy(
      dailyPiecesTable.id,
      dailyPiecesTable.date,
      storiesTable.displayName,
      dailyPiecesTable.winningStandingCents,
    )
    .orderBy(desc(dailyPiecesTable.date), desc(dailyPiecesTable.id))
    .limit(pageSize)
    .offset(offset);

  const response = GetArchiveResponse.parse({
    items: rows.map((row) => ({
      ...row,
      participantCount: Number(row.participantCount),
    })),
    pagination: pagination(Number(totalRow?.total ?? 0), page, pageSize),
  });
  res.json(response);
});

router.get("/archive/:date", async (req, res): Promise<void> => {
  const archiveDate = parseArchiveDate(req.params.date);
  if (!archiveDate) {
    res.status(400).json({ error: "date must be an ISO calendar date." });
    return;
  }

  const [row] = await db
    .select({
      id: dailyPiecesTable.id,
      date: dailyPiecesTable.date,
      winnerDisplayName: storiesTable.displayName,
      winningStory: storiesTable.storyText,
      winningStandingCents: dailyPiecesTable.winningStandingCents,
      participantCount: count(participantStandingsTable.userId),
      winnerWebsiteUrl: storiesTable.websiteUrl,
    })
    .from(dailyPiecesTable)
    // A hidden winning story is intentionally not a public archive detail.
    .innerJoin(
      storiesTable,
      and(
        eq(storiesTable.userId, dailyPiecesTable.winnerUserId),
        eq(storiesTable.dailyPieceId, dailyPiecesTable.id),
        eq(storiesTable.status, "visible"),
      ),
    )
    .leftJoin(
      participantStandingsTable,
      eq(participantStandingsTable.dailyPieceId, dailyPiecesTable.id),
    )
    .where(
      and(
        eq(dailyPiecesTable.date, archiveDate),
        eq(dailyPiecesTable.status, "closed"),
      ),
    )
    .groupBy(
      dailyPiecesTable.id,
      dailyPiecesTable.date,
      storiesTable.displayName,
      storiesTable.storyText,
      dailyPiecesTable.winningStandingCents,
      storiesTable.websiteUrl,
    );

  if (!row) {
    res.status(404).json({ error: "Closed archive day not found." });
    return;
  }
  res.json(
    GetArchiveDetailResponse.parse({
      ...row,
      participantCount: Number(row.participantCount),
      winnerWebsiteUrl: row.winnerWebsiteUrl ?? null,
    }),
  );
});

router.get("/me/history", async (req, res): Promise<void> => {
  const user = await getAuthenticatedLocalUser(req);
  if (!user) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  const parsed = GetMyHistoryQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { page, pageSize } = parsed.data;
  const offset = (page - 1) * pageSize;
  const [totalRow] = await db
    .select({ total: count() })
    .from(storiesTable)
    .where(eq(storiesTable.userId, user.id));
  const days = await db
    .select({
      dayId: dailyPiecesTable.id,
      date: dailyPiecesTable.date,
      dayStatus: dailyPiecesTable.status,
      winnerUserId: dailyPiecesTable.winnerUserId,
      storyText: storiesTable.storyText,
      displayName: storiesTable.displayName,
      websiteUrl: storiesTable.websiteUrl,
      storyStatus: storiesTable.status,
      runningTotalCents: participantStandingsTable.runningTotalCents,
    })
    .from(storiesTable)
    .innerJoin(
      dailyPiecesTable,
      eq(storiesTable.dailyPieceId, dailyPiecesTable.id),
    )
    .leftJoin(
      participantStandingsTable,
      and(
        eq(participantStandingsTable.dailyPieceId, dailyPiecesTable.id),
        eq(participantStandingsTable.userId, user.id),
      ),
    )
    .where(eq(storiesTable.userId, user.id))
    .orderBy(desc(dailyPiecesTable.date), desc(dailyPiecesTable.id))
    .limit(pageSize)
    .offset(offset);

  const dayIds = days.map((day) => day.dayId);
  const standings = dayIds.length
    ? await db
        .select()
        .from(participantStandingsTable)
        .where(inArray(participantStandingsTable.dailyPieceId, dayIds))
    : [];
  const payments = dayIds.length
    ? await db
        .select({
          dailyPieceId: bidsTable.dailyPieceId,
          amountCents: bidsTable.amountCents,
          capturedAt: bidsTable.capturedAt,
          paymentReference: bidsTable.paymentReference,
        })
        .from(bidsTable)
        .where(
          and(
            eq(bidsTable.userId, user.id),
            eq(bidsTable.paymentStatus, "captured"),
            isNotNull(bidsTable.capturedAt),
            inArray(bidsTable.dailyPieceId, dayIds),
          ),
        )
        .orderBy(asc(bidsTable.capturedAt), asc(bidsTable.id))
    : [];

  const standingsByDay = new Map<string, typeof standings>();
  for (const standing of standings) {
    const list = standingsByDay.get(standing.dailyPieceId) ?? [];
    list.push(standing);
    standingsByDay.set(standing.dailyPieceId, list);
  }
  const paymentsByDay = new Map<string, typeof payments>();
  for (const payment of payments) {
    const list = paymentsByDay.get(payment.dailyPieceId) ?? [];
    list.push(payment);
    paymentsByDay.set(payment.dailyPieceId, list);
  }

  const items = days.map((day) => {
    const dayStandings = [...(standingsByDay.get(day.dayId) ?? [])].sort(
      (a, b) => {
        if (a.runningTotalCents !== b.runningTotalCents) {
          return b.runningTotalCents - a.runningTotalCents;
        }
        if (a.standingReachedAt && b.standingReachedAt) {
          const timeOrder =
            a.standingReachedAt.getTime() - b.standingReachedAt.getTime();
          if (timeOrder !== 0) return timeOrder;
        } else if (a.standingReachedAt) {
          return -1;
        } else if (b.standingReachedAt) {
          return 1;
        }
        return a.userId.localeCompare(b.userId);
      },
    );
    const rankIndex = dayStandings.findIndex(
      (standing) => standing.userId === user.id,
    );
    const result =
      day.dayStatus === "active"
        ? "in_progress"
        : day.winnerUserId === user.id
          ? "won"
          : "lost";
    return {
      dayId: day.dayId,
      date: day.date,
      status: day.dayStatus,
      storyText: day.storyText,
      displayName: day.displayName,
      websiteUrl: day.websiteUrl ?? null,
      storyStatus: day.storyStatus,
      payments: (paymentsByDay.get(day.dayId) ?? []).map((payment) => ({
        amountCents: payment.amountCents,
        capturedAt: payment.capturedAt,
        paymentReference: payment.paymentReference,
      })),
      finalRunningTotalCents: day.runningTotalCents ?? 0,
      finalRank: rankIndex < 0 ? null : rankIndex + 1,
      result,
    };
  });

  res.json(
    GetMyHistoryResponse.parse({
      items,
      pagination: pagination(Number(totalRow?.total ?? 0), page, pageSize),
    }),
  );
});

export default router;