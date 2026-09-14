import { and, desc, eq, gt } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateStoryBody,
  CreateStoryResponse,
  GetStoryPaymentParams,
  GetStoryPaymentResponse,
} from "@workspace/api-zod";
import {
  db,
  dailyPiecesTable,
  paymentOrdersTable,
  storiesTable,
} from "@workspace/db";
import { getAuthenticatedLocalUser } from "../lib/authenticated-user";

const router: IRouter = Router();

function validWebsiteUrl(value: string | null | undefined): boolean {
  if (value == null || value.trim() === "") return true;
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

async function storyPaymentContext(storyId: string, dailyPieceId: string) {
  const [story] = await db
    .select()
    .from(storiesTable)
    .where(eq(storiesTable.id, storyId))
    .limit(1);
  const [day] = await db
    .select()
    .from(dailyPiecesTable)
    .where(eq(dailyPiecesTable.id, dailyPieceId))
    .limit(1);
  const [order] = await db
    .select()
    .from(paymentOrdersTable)
    .where(eq(paymentOrdersTable.storyId, storyId))
    .orderBy(desc(paymentOrdersTable.createdAt))
    .limit(1);
  return {
    storyId: story!.id,
    dailyPieceId: day!.id,
    status: story!.status === "visible" ? "visible" : "pending_payment",
    paymentStatus: order?.status ?? "pending",
    minimumPaymentCents: day!.minimumPaymentCents,
    amountCents: order?.amountCents ?? null,
    currency: "USD" as const,
  };
}

router.post("/stories", async (req, res): Promise<void> => {
  const user = await getAuthenticatedLocalUser(req);
  if (!user) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  const parsed = CreateStoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (!validWebsiteUrl(parsed.data.websiteUrl)) {
    res.status(400).json({ error: "websiteUrl must be an absolute HTTP(S) URL." });
    return;
  }

  const now = new Date();
  const [day] = await db
    .select()
    .from(dailyPiecesTable)
    .where(
      and(
        eq(dailyPiecesTable.status, "active"),
        gt(dailyPiecesTable.closingTimestamp, now),
      ),
    )
    .limit(1);
  if (!day) {
    res.status(404).json({ error: "There is no active competition." });
    return;
  }

  const values = {
    userId: user.id,
    dailyPieceId: day.id,
    displayName: parsed.data.displayName.trim(),
    storyText: parsed.data.storyText.trim(),
    websiteUrl: parsed.data.websiteUrl?.trim() || null,
    status: "hidden" as const,
  };
  if (!values.displayName || !values.storyText) {
    res.status(400).json({ error: "displayName and storyText cannot be blank." });
    return;
  }

  let story = (
    await db.insert(storiesTable).values(values).onConflictDoNothing().returning()
  )[0];
  if (!story) {
    [story] = await db
      .select()
      .from(storiesTable)
      .where(
        and(
          eq(storiesTable.userId, user.id),
          eq(storiesTable.dailyPieceId, day.id),
        ),
      )
      .limit(1);
  }
  if (!story) {
    res.status(409).json({ error: "You already have a story for today's piece." });
    return;
  }
  const context = await storyPaymentContext(story.id, day.id);
  res.status(201).json(CreateStoryResponse.parse(context));
});

router.get("/stories/:storyId/payment", async (req, res): Promise<void> => {
  const user = await getAuthenticatedLocalUser(req);
  if (!user) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  const params = GetStoryPaymentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [story] = await db
    .select()
    .from(storiesTable)
    .where(
      and(
        eq(storiesTable.id, params.data.storyId),
        eq(storiesTable.userId, user.id),
      ),
    )
    .limit(1);
  if (!story) {
    res.status(404).json({ error: "Story not found." });
    return;
  }
  const context = await storyPaymentContext(story.id, story.dailyPieceId);
  res.json(GetStoryPaymentResponse.parse(context));
});

export default router;