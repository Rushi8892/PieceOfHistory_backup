import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { after, before, beforeEach, afterEach, test } from "node:test";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { and, eq } from "drizzle-orm";
import * as schema from "@workspace/db/schema";
import {
  bidsTable,
  dailyPiecesTable,
  participantStandingsTable,
  paymentOrdersTable,
  paymentWebhookEventsTable,
  storiesTable,
  usersTable,
} from "@workspace/db";
import {
  isPaymentAmountAllowed,
  settleCapturedPayment,
  type CapturedPayment,
} from "../src/lib/payment-settlement.ts";
import { createPaymentOrderForStory } from "../src/lib/payment-orders.ts";
import { closeDailyPiece } from "../src/lib/day-close.ts";
import {
  capturedPaymentFromEvent,
  settleAndRecordPaymentWebhook,
} from "../src/routes/payments.ts";

const schemaName = `piece_history_test_${process.pid}`;
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required for settlement tests.");
}

const pool = new Pool({
  connectionString,
  max: 8,
  options: `-c search_path=${schemaName}`,
});
const testDb = drizzle(pool, { schema });
type Scenario = {
  dailyPieceId: string;
  userIds: string[];
  storyIds: string[];
  orderIds: string[];
};

async function applyMigration(path: string): Promise<void> {
  const migration = (await readFile(path, "utf8")).replaceAll(
    '"public".',
    `"${schemaName}".`,
  );
  for (const statement of migration.split("--> statement-breakpoint")) {
    const sql = statement.trim();
    if (sql) await pool.query(sql);
  }
}

before(async () => {
  await pool.query(`CREATE SCHEMA "${schemaName}"`);
  await applyMigration(
    new URL("../../../lib/db/drizzle/0000_ambiguous_maddog.sql", import.meta.url)
      .pathname,
  );
  await applyMigration(
    new URL("../../../lib/db/drizzle/0001_grey_vance_astro.sql", import.meta.url)
      .pathname,
  );
  await applyMigration(
    new URL("../../../lib/db/drizzle/0002_superb_multiple_man.sql", import.meta.url)
      .pathname,
  );
});

after(async () => {
  await pool.end();
  // Every test uses this process-unique schema, so dropping it cannot affect
  // application or another test's rows.
  const admin = new Pool({ connectionString });
  await admin.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
  await admin.end();
});

async function truncateTestSchema(): Promise<void> {
  await pool.query(
    `TRUNCATE TABLE "bids", "payment_orders", "payment_webhook_events", ` +
      `"participant_standings", "stories", "daily_pieces", "users" CASCADE`,
  );
}

beforeEach(truncateTestSchema);
afterEach(truncateTestSchema);

async function createScenario(
  orders: Array<{ userIndex: number; amountCents: number }>,
): Promise<Scenario> {
  const dailyPieceId = randomUUID();
  const userIds = [randomUUID(), randomUUID()];
  const storyIds = [randomUUID(), randomUUID()];
  const orderIds = orders.map(() => randomUUID());
  await testDb.insert(usersTable).values(
    userIds.map((id, index) => ({
      id,
      displayName: `Test participant ${index}`,
      email: `${id}@example.test`,
      authProvider: "test",
      authProviderId: `test-${id}`,
    })),
  );
  await testDb.insert(dailyPiecesTable).values({
    id: dailyPieceId,
    date: `2099-12-${String(Number(process.pid) % 28 + 1).padStart(2, "0")}`,
    closingTimestamp: new Date("2099-12-31T23:59:59.000Z"),
    status: "active",
    minimumPaymentCents: 100,
  });
  await testDb.insert(storiesTable).values(
    storyIds.map((id, index) => ({
      id,
      userId: userIds[index],
      dailyPieceId,
      displayName: `Story ${index}`,
      storyText: "Isolated settlement test story",
      status: "hidden" as const,
    })),
  );
  await testDb.insert(paymentOrdersTable).values(
    orders.map((order, index) => ({
      id: orderIds[index],
      storyId: storyIds[order.userIndex],
      userId: userIds[order.userIndex],
      dailyPieceId,
      razorpayOrderId: `test-order-${orderIds[index]}`,
      amountCents: order.amountCents,
      currency: "USD",
      keyId: "test-key",
      status: "pending" as const,
    })),
  );
  return { dailyPieceId, userIds, storyIds, orderIds };
}

async function cleanupScenario(_scenario: Scenario): Promise<void> {
  // TRUNCATE intentionally bypasses the captured-bid immutability trigger.
  // This is safe because all tests use their own process-unique schema.
  await truncateTestSchema();
}

function capture(
  scenario: Scenario,
  orderIndex: number,
  paymentIndex: number,
  amountCents: number,
  capturedAt: string,
): CapturedPayment {
  return {
    orderId: `test-order-${scenario.orderIds[orderIndex]}`,
    paymentId: `test-payment-${paymentIndex}-${scenario.orderIds[orderIndex]}`,
    amountCents,
    currency: "USD",
    capturedAt: new Date(capturedAt),
  };
}

test("settles A $5, B $10, A $6 and updates the leader after each capture", async () => {
  const scenario = await createScenario([
    { userIndex: 0, amountCents: 500 },
    { userIndex: 1, amountCents: 1000 },
    { userIndex: 0, amountCents: 600 },
  ]);
  try {
    const first = capture(scenario, 0, 0, 500, "2024-01-01T00:00:00.000Z");
    assert.equal(await settleCapturedPayment(testDb, first), "captured");
    let [day] = await testDb
      .select()
      .from(dailyPiecesTable)
      .where(eq(dailyPiecesTable.id, scenario.dailyPieceId));
    assert.equal(day.winnerUserId, scenario.userIds[0]);
    assert.equal(day.winningStandingCents, 500);

    const second = capture(scenario, 1, 1, 1000, "2024-01-01T00:00:01.000Z");
    assert.equal(await settleCapturedPayment(testDb, second), "captured");
    [day] = await testDb
      .select()
      .from(dailyPiecesTable)
      .where(eq(dailyPiecesTable.id, scenario.dailyPieceId));
    assert.equal(day.winnerUserId, scenario.userIds[1]);
    assert.equal(day.winningStandingCents, 1000);

    const third = capture(scenario, 2, 2, 600, "2024-01-01T00:00:02.000Z");
    assert.equal(await settleCapturedPayment(testDb, third), "captured");
    [day] = await testDb
      .select()
      .from(dailyPiecesTable)
      .where(eq(dailyPiecesTable.id, scenario.dailyPieceId));
    assert.equal(day.winnerUserId, scenario.userIds[0]);
    assert.equal(day.winningStandingCents, 1100);
    const [standing] = await testDb
      .select()
      .from(participantStandingsTable)
      .where(
        and(
          eq(participantStandingsTable.userId, scenario.userIds[0]),
          eq(participantStandingsTable.dailyPieceId, scenario.dailyPieceId),
        ),
      );
    assert.equal(standing.runningTotalCents, 1100);
  } finally {
    await cleanupScenario(scenario);
  }
});

test("rejects a payment below the configured minimum", async () => {
  assert.equal(isPaymentAmountAllowed(99, 100), false);
  const scenario = await createScenario([{ userIndex: 0, amountCents: 99 }]);
  try {
    const result = await settleCapturedPayment(
      testDb,
      capture(scenario, 0, 3, 99, "2024-01-01T00:00:00.000Z"),
    );
    assert.equal(result, "ignored");
    const bids = await testDb
      .select()
      .from(bidsTable)
      .where(eq(bidsTable.dailyPieceId, scenario.dailyPieceId));
    assert.equal(bids.length, 0);
  } finally {
    await cleanupScenario(scenario);
  }
});

test("allows a visible story to create a cumulative second order", async () => {
  const scenario = await createScenario([{ userIndex: 0, amountCents: 500 }]);
  try {
    assert.equal(
      await settleCapturedPayment(
        testDb,
        capture(scenario, 0, 7, 500, "2024-01-01T00:00:00.000Z"),
      ),
      "captured",
    );
    const receipts: string[] = [];
    let orderNumber = 0;
    const fakeRazorpay = {
      async createOrder({
        amountCents,
        receipt: providedReceipt,
      }: {
        amountCents: number;
        receipt: string;
      }) {
        receipts.push(providedReceipt);
        orderNumber += 1;
        return {
          id: `test-visible-story-order-${orderNumber}`,
          amount: amountCents,
          currency: "USD" as const,
        };
      },
    };
    const firstOrder = await createPaymentOrderForStory(
      testDb,
      {
        userId: scenario.userIds[0],
        storyId: scenario.storyIds[0],
        amountCents: 600,
      },
      fakeRazorpay,
      "test-key",
    );
    const secondOrder = await createPaymentOrderForStory(
      testDb,
      {
        userId: scenario.userIds[0],
        storyId: scenario.storyIds[0],
        amountCents: 700,
      },
      fakeRazorpay,
      "test-key",
    );
    assert.deepEqual(firstOrder, {
      orderId: "test-visible-story-order-1",
      amountCents: 600,
      currency: "USD",
      keyId: "test-key",
    });
    assert.deepEqual(secondOrder, {
      orderId: "test-visible-story-order-2",
      amountCents: 700,
      currency: "USD",
      keyId: "test-key",
    });
    assert.equal(receipts.length, 2);
    assert.notEqual(receipts[0], receipts[1]);
    for (const receipt of receipts) {
      assert.ok(receipt.startsWith("poh-"));
      assert.ok(receipt.length <= 40);
    }
    const orders = await testDb
      .select()
      .from(paymentOrdersTable)
      .where(eq(paymentOrdersTable.storyId, scenario.storyIds[0]));
    assert.equal(orders.length, 3);
  } finally {
    await cleanupScenario(scenario);
  }
});

test("uses top-level webhook created_at when payment entity has no captured_at", () => {
  const capturedAt = 1_700_000_000;
  const payment = capturedPaymentFromEvent(
    "payment.captured",
    {
      payment: {
        entity: {
          id: "pay_realistic",
          order_id: "order_realistic",
          amount: 500,
          currency: "USD",
          status: "captured",
          created_at: capturedAt,
        },
      },
      order: {
        entity: {
          id: "order_realistic",
          amount: 500,
          currency: "USD",
        },
      },
    },
    capturedAt,
  );
  assert.ok(payment);
  assert.equal(payment.paymentId, "pay_realistic");
  assert.equal(payment.capturedAt.getTime(), capturedAt * 1000);
});

test("replayed payment cannot double-count a captured bid", async () => {
  const scenario = await createScenario([{ userIndex: 0, amountCents: 500 }]);
  try {
    const payment = capture(scenario, 0, 4, 500, "2024-01-01T00:00:00.000Z");
    assert.equal(await settleCapturedPayment(testDb, payment), "captured");
    assert.equal(await settleCapturedPayment(testDb, payment), "replayed");
    const bids = await testDb
      .select()
      .from(bidsTable)
      .where(eq(bidsTable.dailyPieceId, scenario.dailyPieceId));
    assert.equal(bids.length, 1);
    assert.equal(bids[0].amountCents, 500);
  } finally {
    await cleanupScenario(scenario);
  }
});

test("unknown local orders remain retryable and are not marked processed", async () => {
  const eventId = `unknown-event-${randomUUID()}`;
  const result = await settleAndRecordPaymentWebhook(testDb, eventId, "payment.captured", {
    orderId: `unknown-order-${randomUUID()}`,
    paymentId: `unknown-payment-${randomUUID()}`,
    amountCents: 500,
    currency: "USD",
    capturedAt: new Date("2024-01-01T00:00:00.000Z"),
  });
  assert.equal(result, "unknown_order");
  const events = await testDb
    .select()
    .from(paymentWebhookEventsTable)
    .where(eq(paymentWebhookEventsTable.eventId, eventId));
  assert.equal(events.length, 0);
});

test("accepts a delayed pre-deadline capture and rejects a post-deadline capture", async () => {
  const accepted = await createScenario([{ userIndex: 0, amountCents: 500 }]);
  try {
    await testDb
      .update(dailyPiecesTable)
      .set({ closingTimestamp: new Date("2024-01-02T00:00:00.000Z") })
      .where(eq(dailyPiecesTable.id, accepted.dailyPieceId));
    assert.equal(
      await settleCapturedPayment(
        testDb,
        capture(accepted, 0, 8, 500, "2024-01-01T23:59:59.000Z"),
      ),
      "captured",
    );
  } finally {
    await cleanupScenario(accepted);
  }

  const rejected = await createScenario([{ userIndex: 0, amountCents: 500 }]);
  try {
    await testDb
      .update(dailyPiecesTable)
      .set({ closingTimestamp: new Date("2024-01-02T00:00:00.000Z") })
      .where(eq(dailyPiecesTable.id, rejected.dailyPieceId));
    assert.equal(
      await settleCapturedPayment(
        testDb,
        capture(rejected, 0, 9, 500, "2024-01-02T00:00:01.000Z"),
      ),
      "ignored",
    );
    const bids = await testDb
      .select()
      .from(bidsTable)
      .where(eq(bidsTable.dailyPieceId, rejected.dailyPieceId));
    assert.equal(bids.length, 0);
  } finally {
    await cleanupScenario(rejected);
  }
});

test("out-of-order captures preserve the maximum verified capture time", async () => {
  const scenario = await createScenario([
    { userIndex: 0, amountCents: 500 },
    { userIndex: 0, amountCents: 600 },
  ]);
  try {
    assert.equal(
      await settleCapturedPayment(
        testDb,
        capture(scenario, 1, 10, 600, "2024-01-02T00:00:00.000Z"),
      ),
      "captured",
    );
    assert.equal(
      await settleCapturedPayment(
        testDb,
        capture(scenario, 0, 11, 500, "2024-01-01T00:00:00.000Z"),
      ),
      "captured",
    );
    const [standing] = await testDb
      .select()
      .from(participantStandingsTable)
      .where(
        and(
          eq(participantStandingsTable.userId, scenario.userIds[0]),
          eq(participantStandingsTable.dailyPieceId, scenario.dailyPieceId),
        ),
      );
    assert.equal(standing.runningTotalCents, 1100);
    assert.equal(
      standing.lastPaymentAt?.toISOString(),
      "2024-01-02T00:00:00.000Z",
    );
    assert.equal(
      standing.standingReachedAt?.toISOString(),
      "2024-01-02T00:00:00.000Z",
    );
  } finally {
    await cleanupScenario(scenario);
  }
});

test("concurrent equal captures use standingReachedAt as the deterministic tie-break", async () => {
  const scenario = await createScenario([
    { userIndex: 0, amountCents: 500 },
    { userIndex: 1, amountCents: 500 },
  ]);
  try {
    const earlier = capture(
      scenario,
      0,
      5,
      500,
      "2024-01-01T00:00:00.000Z",
    );
    const later = capture(
      scenario,
      1,
      6,
      500,
      "2024-01-01T00:00:01.000Z",
    );
    const results = await Promise.all([
      settleCapturedPayment(testDb, later),
      settleCapturedPayment(testDb, earlier),
    ]);
    assert.deepEqual(results.sort(), ["captured", "captured"]);
    const [day] = await testDb
      .select()
      .from(dailyPiecesTable)
      .where(eq(dailyPiecesTable.id, scenario.dailyPieceId));
    assert.equal(day.winnerUserId, scenario.userIds[0]);
    assert.equal(day.winningStandingCents, 500);
  } finally {
    await cleanupScenario(scenario);
  }
});

test("closing a day twice preserves the winner and creates one next active day", async () => {
  const scenario = await createScenario([
    { userIndex: 0, amountCents: 500 },
    { userIndex: 1, amountCents: 1000 },
  ]);
  try {
    await settleCapturedPayment(
      testDb,
      capture(scenario, 0, 20, 500, "2099-12-01T00:00:00.000Z"),
    );
    await settleCapturedPayment(
      testDb,
      capture(scenario, 1, 21, 1000, "2099-12-01T00:00:01.000Z"),
    );

    const closeTime = new Date("2100-01-01T00:00:00.000Z");
    const first = await closeDailyPiece(testDb, scenario.dailyPieceId, closeTime);
    const second = await closeDailyPiece(testDb, scenario.dailyPieceId, closeTime);

    assert.deepEqual(second, first);
    assert.equal(first?.winnerUserId, scenario.userIds[1]);
    assert.equal(first?.winningStandingCents, 1000);

    const activeDays = await testDb
      .select()
      .from(dailyPiecesTable)
      .where(eq(dailyPiecesTable.status, "active"));
    assert.equal(activeDays.length, 1);
    assert.equal(activeDays[0].id, first?.nextDailyPieceId);
  } finally {
    await cleanupScenario(scenario);
  }
});