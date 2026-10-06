const { getSql, ensureSchema } = require("./_db");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await ensureSchema();
    const sql = getSql();
    const range = req.query?.range === "today" ? "today" : "alltime";

    if (range === "today") {
      // Best score per user from daily_scores, which is cleared every day
      // at 12:00 PM (see api/cron/reset-daily.js), so this covers "since
      // the last noon reset".
      const rows = await sql`
        SELECT u.username, u.avatar_url AS "avatarUrl", MAX(d.score) AS score
        FROM daily_scores d
        JOIN users u ON u.id = d.user_id
        GROUP BY u.username, u.avatar_url
        ORDER BY score DESC
        LIMIT 50
      `;
      return res.status(200).json({ range, entries: rows });
    }

    const rows = await sql`
      SELECT username, avatar_url AS "avatarUrl", best_score AS score
      FROM users
      WHERE best_score > 0
      ORDER BY best_score DESC
      LIMIT 50
    `;
    res.status(200).json({ range, entries: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Leaderboard fetch failed" });
  }
};
