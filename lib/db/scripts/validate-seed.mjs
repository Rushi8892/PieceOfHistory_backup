import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set to validate the release seed.");
}

const packageDirectory = new URL("../", import.meta.url);
const temporaryDatabase = `poh_seed_${process.pid}_${randomUUID().replaceAll("-", "")}`;
const baseUrl = new URL(process.env.DATABASE_URL);
const temporaryUrl = new URL(baseUrl);
temporaryUrl.pathname = `/${temporaryDatabase}`;

function quoteIdentifier(identifier) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function runPnpm(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("pnpm", args, {
      cwd: packageDirectory,
      env: {
        ...process.env,
        DATABASE_URL: temporaryUrl.toString(),
      },
      stdio: "inherit",
    });

    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `pnpm ${args.join(" ")} failed with ${
            signal ? `signal ${signal}` : `exit code ${code}`
          }.`,
        ),
      );
    });
  });
}

async function readSnapshot(pool) {
  const todayResult = await pool.query("SELECT CURRENT_DATE::text AS today");
  const today = todayResult.rows[0].today;
  const daysResult = await pool.query(`
    SELECT
      daily_pieces.date::text AS date,
      daily_pieces.status,
      count(DISTINCT stories.id) FILTER (
        WHERE story_users.auth_provider = 'seed'
      ) AS seeded_stories,
      count(DISTINCT participant_standings.user_id) FILTER (
        WHERE standing_users.auth_provider = 'seed'
      ) AS seeded_standings
    FROM daily_pieces
    LEFT JOIN stories
      ON stories.daily_piece_id = daily_pieces.id
    LEFT JOIN users AS story_users
      ON story_users.id = stories.user_id
    LEFT JOIN participant_standings
      ON participant_standings.daily_piece_id = daily_pieces.id
    LEFT JOIN users AS standing_users
      ON standing_users.id = participant_standings.user_id
    GROUP BY daily_pieces.id, daily_pieces.date, daily_pieces.status
    ORDER BY daily_pieces.date
  `);
  const countsResult = await pool.query(`
    SELECT
      (SELECT count(*) FROM users WHERE auth_provider = 'seed') AS seeded_users,
      (SELECT count(*) FROM daily_pieces WHERE status = 'active') AS active_days,
      (SELECT count(*) FROM daily_pieces WHERE status = 'closed') AS closed_days,
      (SELECT count(*) FROM stories WHERE user_id IN (
        SELECT id FROM users WHERE auth_provider = 'seed'
      )) AS seeded_stories,
      (SELECT count(*) FROM participant_standings WHERE user_id IN (
        SELECT id FROM users WHERE auth_provider = 'seed'
      )) AS seeded_standings
  `);

  return {
    today,
    days: daysResult.rows,
    counts: countsResult.rows[0],
  };
}

async function assertEmpty(pool) {
  const result = await pool.query(`
    SELECT
      (SELECT count(*) FROM users) AS users,
      (SELECT count(*) FROM daily_pieces) AS daily_pieces,
      (SELECT count(*) FROM stories) AS stories,
      (SELECT count(*) FROM participant_standings) AS participant_standings
  `);
  const counts = result.rows[0];
  if (Object.values(counts).some((count) => count !== "0")) {
    throw new Error(`Temporary database was not empty: ${JSON.stringify(counts)}`);
  }
}

function assertSeedSnapshot(snapshot) {
  const expectedCounts = {
    seeded_users: "5",
    active_days: "1",
    closed_days: "5",
    seeded_stories: "20",
    seeded_standings: "20",
  };

  if (JSON.stringify(snapshot.counts) !== JSON.stringify(expectedCounts)) {
    throw new Error(
      `Unexpected seed counts: ${JSON.stringify(snapshot.counts)}`,
    );
  }

  const expectedDays = [
    { offset: 0, status: "active", seededStories: "5", seededStandings: "5" },
    { offset: 1, status: "closed", seededStories: "3", seededStandings: "3" },
    { offset: 2, status: "closed", seededStories: "3", seededStandings: "3" },
    { offset: 4, status: "closed", seededStories: "3", seededStandings: "3" },
    { offset: 6, status: "closed", seededStories: "3", seededStandings: "3" },
    { offset: 8, status: "closed", seededStories: "3", seededStandings: "3" },
  ];

  const actualDays = snapshot.days.map((day) => ({
    offset: Math.round(
      (Date.parse(`${snapshot.today}T00:00:00Z`) -
        Date.parse(`${day.date}T00:00:00Z`)) /
        86400000,
    ),
    status: day.status,
    seededStories: day.seeded_stories,
    seededStandings: day.seeded_standings,
  })).sort((left, right) => left.offset - right.offset);

  if (JSON.stringify(actualDays) !== JSON.stringify(expectedDays)) {
    throw new Error(
      `Unexpected seeded days: ${JSON.stringify(actualDays)}`,
    );
  }
}

let adminPool;
let temporaryPool;

try {
  adminPool = new Pool({ connectionString: baseUrl.toString() });
  await adminPool.query(
    `CREATE DATABASE ${quoteIdentifier(temporaryDatabase)}`,
  );
  await adminPool.end();
  adminPool = undefined;

  await runPnpm(["run", "push"]);

  temporaryPool = new Pool({ connectionString: temporaryUrl.toString() });
  await assertEmpty(temporaryPool);

  await runPnpm(["run", "seed"]);
  const firstSnapshot = await readSnapshot(temporaryPool);
  assertSeedSnapshot(firstSnapshot);

  await runPnpm(["run", "seed"]);
  const secondSnapshot = await readSnapshot(temporaryPool);
  assertSeedSnapshot(secondSnapshot);

  if (JSON.stringify(firstSnapshot) !== JSON.stringify(secondSnapshot)) {
    throw new Error(
      `Seed is not idempotent: snapshots changed between runs. First: ${JSON.stringify(
        firstSnapshot,
      )}; second: ${JSON.stringify(secondSnapshot)}`,
    );
  }

  console.log(
    JSON.stringify({
      validated: true,
      emptyDatabase: true,
      idempotent: true,
      counts: secondSnapshot.counts,
    }),
  );
} finally {
  await temporaryPool?.end();
  await adminPool?.end();

  const cleanupPool = new Pool({ connectionString: baseUrl.toString() });
  await cleanupPool.query(
    `DROP DATABASE IF EXISTS ${quoteIdentifier(temporaryDatabase)}`,
  );
  await cleanupPool.end();
}