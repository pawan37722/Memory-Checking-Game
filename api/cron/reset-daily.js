const { getSql, ensureSchema } = require("../_db");

// Vercel Cron calls this every day at the schedule set in vercel.json
// ("crons"). It sends `Authorization: Bearer <CRON_SECRET>` automatically
// when a CRON_SECRET env var is set on the project - we check for that so
// randoms on the internet can't wipe the table by hitting the URL directly.
module.exports = async (req, res) => {
  try {
    if (process.env.CRON_SECRET) {
      const auth = req.headers["authorization"] || "";
      if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: "Unauthorized" });
      }
    }

    await ensureSchema();
    const sql = getSql();
    const result = await sql`DELETE FROM daily_scores`;
    res.status(200).json({ ok: true, deleted: result.length ?? result.count ?? null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Reset failed" });
  }
};
