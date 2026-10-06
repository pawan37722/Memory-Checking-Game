const { getSql, ensureSchema } = require("./_db");
const { requireAuth } = require("./_auth");

function parseBody(req) {
  return typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
}

module.exports = async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return; // requireAuth already sent the error response

  try {
    await ensureSchema();
    const sql = getSql();

    if (req.method === "GET") {
      const rows = await sql`SELECT best_score FROM users WHERE id = ${user.sub}`;
      return res.status(200).json({ bestScore: rows[0]?.best_score ?? 0 });
    }

    if (req.method === "POST") {
      const body = parseBody(req);
      const score = Number(body.score);
      if (!Number.isFinite(score) || score < 0) {
        return res.status(400).json({ error: "Invalid score" });
      }
      const rows = await sql`
        UPDATE users
        SET best_score = GREATEST(best_score, ${score})
        WHERE id = ${user.sub}
        RETURNING best_score
      `;

      // Log this game for the "Today" leaderboard. This table is cleared
      // every day at 12 PM by api/cron/reset-daily.js.
      await sql`
        INSERT INTO daily_scores (user_id, username, score)
        VALUES (${user.sub}, ${user.username}, ${score})
      `;

      return res.status(200).json({ bestScore: rows[0].best_score });
    }

    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Score update failed" });
  }
};
