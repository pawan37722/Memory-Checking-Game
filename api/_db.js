const { neon } = require("@neondatabase/serverless");

let sql;

function getSql() {
  if (!sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    sql = neon(process.env.DATABASE_URL);
  }
  return sql;
}

let schemaReady = false;

async function ensureSchema() {
  if (schemaReady) return;
  const sql = getSql();

  // Core users table - now also holds an optional profile picture
  // (stored as a base64 data: URL, capped at 50MB - see api/profile.js).
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      best_score INTEGER NOT NULL DEFAULT 0,
      avatar_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  // Backfill avatar_url for databases created before this column existed.
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT`;

  // Every finished game is logged here (in addition to updating
  // users.best_score) so the "Today" leaderboard has something to read.
  // This table is wiped every day at 12:00 PM by api/cron/reset-daily.js -
  // see vercel.json "crons" - so "today" means "since the last noon reset",
  // not necessarily midnight-to-midnight.
  await sql`
    CREATE TABLE IF NOT EXISTS daily_scores (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      username TEXT NOT NULL,
      score INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS daily_scores_score_idx ON daily_scores (score DESC)`;

  schemaReady = true;
}

module.exports = { getSql, ensureSchema };
