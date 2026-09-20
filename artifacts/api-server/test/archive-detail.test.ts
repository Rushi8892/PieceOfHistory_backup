import { randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { eq } from "drizzle-orm";
import {
  db,
  dailyPiecesTable,
  participantStandingsTable,
  pool,
  storiesTable,
  usersTable,
} from "@workspace/db";
import app from "../src/app.ts";

const fixtureUserId = randomUUID();
const fixtureDailyPieceId = randomUUID();
const fixtureStoryId = randomUUID();
const activeFixtureDailyPieceId = randomUUID();
const winningStandingCents = 27500;
let archiveDate: string;
let missingArchiveDate: string;
let activeArchiveDate: string;
let insertedActiveFixture = false;
let baseUrl: string;
let server: ReturnType<typeof app.listen>;

async function findUnusedArchiveDate(excludedDates = new Set<string>()): Promise<string> {
  for (let offset = 0; offset < 365; offset += 1) {
    const date = new Date("2099-01-01T00:00:00.000Z");
    date.setUTCDate(date.getUTCDate() + offset);
    const candidate = date.toISOString().slice(0, 10);
    if (excludedDates.has(candidate)) continue;
    const [existing] = await db
      .select({ id: dailyPiecesTable.id })
      .from(dailyPiecesTable)
      .where(eq(dailyPiecesTable.date, candidate));
    if (!existing) return candidate;
  }
  throw new Error("Could not find an unused archive fixture date.");
}

async function findActiveArchiveDate(): Promise<string | null> {
  const [activeDay] = await db
    .select({ date: dailyPiecesTable.date })
    .from(dailyPiecesTable)
    .where(eq(dailyPiecesTable.status, "active"));
  return activeDay?.date ?? null;
}

before(async () => {
  archiveDate = await findUnusedArchiveDate();
  missingArchiveDate = await findUnusedArchiveDate(new Set([archiveDate]));
  activeArchiveDate = (await findActiveArchiveDate()) ?? "";
  if (!activeArchiveDate) {
    activeArchiveDate = await findUnusedArchiveDate(
      new Set([archiveDate, missingArchiveDate]),
    );
    await db.insert(dailyPiecesTable).values({
      id: activeFixtureDailyPieceId,
      date: activeArchiveDate,
      closingTimestamp: new Date(`${activeArchiveDate}T23:59:59.000Z`),
      status: "active",
      minimumPaymentCents: 100,
    });
    insertedActiveFixture = true;
  }

  await db.insert(usersTable).values({
    id: fixtureUserId,
    displayName: "Archive winner",
    email: `${fixtureUserId}@example.test`,
    authProvider: "test",
    authProviderId: `archive-detail-${fixtureUserId}`,
  });
  await db.insert(dailyPiecesTable).values({
    id: fixtureDailyPieceId,
    date: archiveDate,
    closingTimestamp: new Date(`${archiveDate}T23:59:59.000Z`),
    status: "closed",
    winnerUserId: fixtureUserId,
    winningStandingCents,
    minimumPaymentCents: 100,
    closedAt: new Date(`${archiveDate}T23:59:59.000Z`),
  });
  await db.insert(storiesTable).values({
    id: fixtureStoryId,
    userId: fixtureUserId,
    dailyPieceId: fixtureDailyPieceId,
    displayName: "Archive winner",
    storyText: "This story belongs in the permanent record.",
    websiteUrl: "https://example.test/winning-record",
    status: "visible",
  });
  await db.insert(participantStandingsTable).values({
    userId: fixtureUserId,
    dailyPieceId: fixtureDailyPieceId,
    runningTotalCents: winningStandingCents,
    standingReachedAt: new Date(`${archiveDate}T12:00:00.000Z`),
  });

  await new Promise<void>((resolve, reject) => {
    server = app.listen(0, () => resolve());
    server.once("error", reject);
  });
  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  await db
    .delete(participantStandingsTable)
    .where(eq(participantStandingsTable.dailyPieceId, fixtureDailyPieceId));
  await db
    .delete(storiesTable)
    .where(eq(storiesTable.id, fixtureStoryId));
  await db
    .delete(dailyPiecesTable)
    .where(eq(dailyPiecesTable.id, fixtureDailyPieceId));
  if (insertedActiveFixture) {
    await db
      .delete(dailyPiecesTable)
      .where(eq(dailyPiecesTable.id, activeFixtureDailyPieceId));
  }
  await db.delete(usersTable).where(eq(usersTable.id, fixtureUserId));
  await pool.end();
});

test("returns the winning record for a closed date-only archive path", async () => {
  const response = await fetch(`${baseUrl}/api/archive/${archiveDate}`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    id: fixtureDailyPieceId,
    date: `${archiveDate}T00:00:00.000Z`,
    winnerDisplayName: "Archive winner",
    winningStory: "This story belongs in the permanent record.",
    winningStandingCents,
    participantCount: 1,
    winnerWebsiteUrl: "https://example.test/winning-record",
  });
});

test("returns the same winner and amount in the archive list", async () => {
  const response = await fetch(`${baseUrl}/api/archive?page=1&pageSize=100`);

  assert.equal(response.status, 200);
  const archive = await response.json();
  const fixture = archive.items.find(
    (item: { id: string }) => item.id === fixtureDailyPieceId,
  );

  assert.deepEqual(fixture, {
    id: fixtureDailyPieceId,
    date: `${archiveDate}T00:00:00.000Z`,
    winnerDisplayName: "Archive winner",
    winningStandingCents,
    participantCount: 1,
  });
});

test("returns 404 for a date that has no archive record", async () => {
  const response = await fetch(`${baseUrl}/api/archive/${missingArchiveDate}`);

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), {
    error: "Closed archive day not found.",
  });
});

test("returns 404 for an active day", async () => {
  const response = await fetch(`${baseUrl}/api/archive/${activeArchiveDate}`);

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), {
    error: "Closed archive day not found.",
  });
});

test("rejects timestamp archive paths as invalid calendar dates", async () => {
  const timestampPath = `${archiveDate}T00:00:00.000Z`;
  const response = await fetch(
    `${baseUrl}/api/archive/${encodeURIComponent(timestampPath)}`,
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "date must be an ISO calendar date.",
  });
});