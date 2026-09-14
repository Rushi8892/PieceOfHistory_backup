import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  const result = await pool.query(`
    INSERT INTO daily_pieces (
      date,
      closing_timestamp,
      status,
      minimum_payment_cents
    )
    SELECT
      CURRENT_DATE,
      date_trunc('day', NOW()) + INTERVAL '23 hours 59 minutes 59 seconds',
      'active',
      100
    WHERE NOT EXISTS (
      SELECT 1 FROM daily_pieces WHERE status = 'active'
    )
    RETURNING id, date, closing_timestamp, minimum_payment_cents
  `);

  if (result.rows.length === 0) {
    const active = await pool.query(`
      SELECT id, date, closing_timestamp, minimum_payment_cents
      FROM daily_pieces
      WHERE status = 'active'
      LIMIT 1
    `);
    console.log(JSON.stringify({ created: false, active: active.rows[0] ?? null }));
  } else {
    console.log(JSON.stringify({ created: true, active: result.rows[0] }));
  }
} finally {
  await pool.end();
}