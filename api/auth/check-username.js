const { getSql, ensureSchema } = require("../_db");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const username = String(req.query?.username || "").trim();
    if (!username) {
      return res.status(200).json({ exists: false });
    }

    await ensureSchema();
    const sql = getSql();
    const rows = await sql`SELECT id FROM users WHERE username = ${username}`;
    res.status(200).json({ exists: rows.length > 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lookup failed" });
  }
};
