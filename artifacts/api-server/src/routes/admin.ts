import { and, asc, count, desc, eq, isNotNull } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  GetAdminOverviewQueryParams,
  GetAdminOverviewResponse,
  HideAdminStoryParams,
  HideAdminStoryResponse,
} from "@workspace/api-zod";
import {
  bidsTable,
  db,
  dailyPiecesTable,
  paymentOrdersTable,
  storiesTable,
  usersTable,
} from "@workspace/db";
import { requireAdmin } from "../lib/require-admin";

const router: IRouter = Router();

function pagination(total: number, page: number, pageSize: number) {
  return {
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

router.get("/admin/overview", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const parsed = GetAdminOverviewQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { page, pageSize } = parsed.data;
  const offset = (page - 1) * pageSize;
  const [[userCount], [closedDayCount], [paymentCount]] = await Promise.all([
    db.select({ total: count() }).from(usersTable),
    db
      .select({ total: count() })
      .from(dailyPiecesTable)
      .where(eq(dailyPiecesTable.status, "closed")),
    db
      .select({ total: count() })
      .from(bidsTable)
      .where(
        and(
          eq(bidsTable.paymentStatus, "captured"),
          isNotNull(bidsTable.capturedAt),
        ),
      ),
  ]);

  const capturedPayments = await db
    .select({
      storyId: paymentOrdersTable.storyId,
      userDisplayName: usersTable.displayName,
      dayDate: dailyPiecesTable.date,
      amountCents: bidsTable.amountCents,
      paymentReference: bidsTable.paymentReference,
      capturedAt: bidsTable.capturedAt,
    })
    .from(bidsTable)
    .innerJoin(
      paymentOrdersTable,
      eq(bidsTable.paymentOrderId, paymentOrdersTable.id),
    )
    .innerJoin(usersTable, eq(bidsTable.userId, usersTable.id))
    .innerJoin(
      dailyPiecesTable,
      eq(bidsTable.dailyPieceId, dailyPiecesTable.id),
    )
    .where(
      and(
        eq(bidsTable.paymentStatus, "captured"),
        isNotNull(bidsTable.capturedAt),
      ),
    )
    .orderBy(desc(bidsTable.capturedAt), asc(bidsTable.id))
    .limit(pageSize)
    .offset(offset);

  const closedDays = await db
    .select({
      dayId: dailyPiecesTable.id,
      date: dailyPiecesTable.date,
      winnerDisplayName: usersTable.displayName,
      winningStandingCents: dailyPiecesTable.winningStandingCents,
      closedAt: dailyPiecesTable.closedAt,
    })
    .from(dailyPiecesTable)
    .leftJoin(usersTable, eq(dailyPiecesTable.winnerUserId, usersTable.id))
    .where(eq(dailyPiecesTable.status, "closed"))
    .orderBy(desc(dailyPiecesTable.date), desc(dailyPiecesTable.id));

  const response = GetAdminOverviewResponse.parse({
    totalUsers: Number(userCount?.total ?? 0),
    totalPiecesOfHistory: Number(closedDayCount?.total ?? 0),
    capturedPayments: capturedPayments.map((payment) => ({
      ...payment,
      status: "captured" as const,
      capturedAt: payment.capturedAt!,
    })),
    capturedPaymentsPagination: pagination(
      Number(paymentCount?.total ?? 0),
      page,
      pageSize,
    ),
    closedDays,
  });
  res.json(response);
});

router.post("/admin/stories/:storyId/hide", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const parsed = HideAdminStoryParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [story] = await db
    .update(storiesTable)
    .set({ status: "moderated" })
    .where(eq(storiesTable.id, parsed.data.storyId))
    .returning({ id: storiesTable.id });
  if (!story) {
    res.status(404).json({ error: "Story not found." });
    return;
  }
  res.json(
    HideAdminStoryResponse.parse({
      storyId: story.id,
      status: "hidden",
    }),
  );
});

export default router;