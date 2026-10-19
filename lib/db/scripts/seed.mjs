import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const seedUsers = [
  {
    authProviderId: "seed-anonymous-1",
    displayName: "Anonymous",
  },
  {
    authProviderId: "seed-rohit-24",
    displayName: "Rohit_24",
  },
  {
    authProviderId: "seed-travel-soul",
    displayName: "TravelSoul",
  },
  {
    authProviderId: "seed-anonymous-2",
    displayName: "Anonymous",
  },
  {
    authProviderId: "seed-dreamer",
    displayName: "Dreamer",
  },
];

const liveStories = [
  {
    story: "The day I finally started something I kept postponing.",
    amountCents: 125000,
  },
  {
    story: "Met my best friend in college today.",
    amountCents: 90000,
  },
  {
    story: "First time in the mountains and I felt alive.",
    amountCents: 65000,
  },
  {
    story: "The day I quit my job and chose myself.",
    amountCents: 40000,
  },
  {
    story: "Finally finished that book I had been avoiding.",
    amountCents: 25000,
  },
];

const archiveDays = [
  {
    offset: 1,
    winnerIndex: 0,
    winnerAmountCents: 85000,
    stories: [
      "I finally did it.",
      "A quiet win on an ordinary day.",
      "The small thing that changed everything.",
    ],
  },
  {
    offset: 2,
    winnerIndex: 1,
    winnerAmountCents: 120000,
    stories: [
      "A new chapter begins.",
      "The message I almost did not send.",
      "A day worth remembering.",
    ],
  },
  {
    offset: 4,
    winnerIndex: 2,
    winnerAmountCents: 60000,
    stories: [
      "Small steps, big dreams.",
      "The view was worth the climb.",
      "I made room for something new.",
    ],
  },
  {
    offset: 6,
    winnerIndex: 3,
    winnerAmountCents: 95000,
    stories: [
      "The day everything changed.",
      "A letter to my future self.",
      "I said yes to the detour.",
    ],
  },
  {
    offset: 8,
    winnerIndex: 4,
    winnerAmountCents: 42000,
    stories: [
      "Just another beautiful day.",
      "The coffee tasted different today.",
      "I remembered to look up.",
    ],
  },
];

async function upsertStoryAndStanding(client, { user, dailyPieceId, story, amountCents }) {
  await client.query(
    `
      INSERT INTO stories (
        user_id,
        daily_piece_id,
        display_name,
        story_text,
        website_url,
        status
      )
      VALUES ($1, $2, $3, $4, NULL, 'visible')
      ON CONFLICT (user_id, daily_piece_id)
      DO UPDATE SET
        display_name = EXCLUDED.display_name,
        story_text = EXCLUDED.story_text,
        status = 'visible',
        updated_at = NOW()
    `,
    [user.id, dailyPieceId, user.displayName, story],
  );

  await client.query(
    `
      INSERT INTO participant_standings (
        user_id,
        daily_piece_id,
        running_total_cents,
        last_payment_at,
        standing_reached_at
      )
      VALUES ($1, $2, $3, NOW(), NOW())
      ON CONFLICT (user_id, daily_piece_id)
      DO UPDATE SET
        running_total_cents = EXCLUDED.running_total_cents,
        last_payment_at = EXCLUDED.last_payment_at,
        standing_reached_at = EXCLUDED.standing_reached_at
    `,
    [user.id, dailyPieceId, amountCents],
  );
}

const client = await pool.connect();

try {
  await client.query("BEGIN");

  const users = [];
  for (const seedUser of seedUsers) {
    const result = await client.query(
      `
        INSERT INTO users (
          display_name,
          email,
          auth_provider,
          auth_provider_id,
          role
        )
        VALUES ($1, NULL, 'seed', $2, 'user')
        ON CONFLICT (auth_provider_id)
        DO UPDATE SET display_name = EXCLUDED.display_name
        RETURNING id, display_name AS "displayName"
      `,
      [seedUser.displayName, seedUser.authProviderId],
    );
    users.push(result.rows[0]);
  }

  let activeResult = await client.query(
    `
      SELECT id, date, closing_timestamp
      FROM daily_pieces
      WHERE status = 'active'
      LIMIT 1
    `,
  );

  if (activeResult.rows.length === 0) {
    activeResult = await client.query(
      `
        INSERT INTO daily_pieces (
          date,
          closing_timestamp,
          status,
          minimum_payment_cents
        )
        VALUES (CURRENT_DATE, NOW() + INTERVAL '8 hours', 'active', 100)
        RETURNING id, date, closing_timestamp
      `,
    );
  }

  const activeDay = activeResult.rows[0];
  for (const [index, liveStory] of liveStories.entries()) {
    await upsertStoryAndStanding(client, {
      user: users[index],
      dailyPieceId: activeDay.id,
      story: liveStory.story,
      amountCents: liveStory.amountCents,
    });
  }

  for (const archiveDay of archiveDays) {
    const dayResult = await client.query(
      `
        INSERT INTO daily_pieces (
          date,
          closing_timestamp,
          status,
          winner_user_id,
          winning_standing_cents,
          minimum_payment_cents,
          closed_at
        )
        VALUES (
          CURRENT_DATE - $1::integer,
          (CURRENT_DATE - $1::integer) + TIME '23:59:59',
          'closed',
          $2,
          $3,
          100,
          NOW() - ($1::integer * INTERVAL '1 day')
        )
        ON CONFLICT (date) DO NOTHING
        RETURNING id, date
      `,
      [archiveDay.offset, users[archiveDay.winnerIndex].id, archiveDay.winnerAmountCents],
    );

    const archivePiece = dayResult.rows[0] ?? (
      await client.query(
        `
          SELECT id, date
          FROM daily_pieces
          WHERE date = CURRENT_DATE - $1::integer
        `,
        [archiveDay.offset],
      )
    ).rows[0];

    if (!archivePiece) {
      throw new Error(`Could not resolve seeded archive day at offset ${archiveDay.offset}`);
    }

    const archiveParticipants = [archiveDay.winnerIndex, (archiveDay.winnerIndex + 1) % users.length, (archiveDay.winnerIndex + 2) % users.length];
    for (const [position, userIndex] of archiveParticipants.entries()) {
      const amountCents = position === 0
        ? archiveDay.winnerAmountCents
        : Math.max(15000, archiveDay.winnerAmountCents - (position * 15000));
      await upsertStoryAndStanding(client, {
        user: users[userIndex],
        dailyPieceId: archivePiece.id,
        story: archiveDay.stories[position],
        amountCents,
      });
    }
  }

  await client.query("COMMIT");

  const summary = await client.query(`
    SELECT
      (SELECT count(*) FROM users WHERE auth_provider = 'seed') AS seeded_users,
      (SELECT count(*) FROM stories WHERE user_id IN (SELECT id FROM users WHERE auth_provider = 'seed')) AS seeded_stories,
      (SELECT count(*) FROM participant_standings WHERE user_id IN (SELECT id FROM users WHERE auth_provider = 'seed')) AS seeded_standings,
      (SELECT count(*) FROM daily_pieces WHERE status = 'closed') AS closed_days
  `);
  console.log(JSON.stringify({ seeded: true, activeDay, ...summary.rows[0] }));
} catch (error) {
  await client.query("ROLLBACK");
  console.error(error);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}