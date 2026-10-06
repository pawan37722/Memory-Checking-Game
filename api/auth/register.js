const bcrypt = require("bcryptjs");
const { getSql, ensureSchema } = require("../_db");
const { signToken } = require("../_auth");

function parseBody(req) {
  return typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = parseBody(req);
    const username = String(body.username || "").trim();
    const password = String(body.password || "");

    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ error: "Username must be 3-30 characters" });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: "Password must be at least 4 characters" });
    }

    await ensureSchema();
    const sql = getSql();

    const existing = await sql`SELECT id FROM users WHERE username = ${username}`;
    if (existing.length > 0) {
      return res.status(409).json({ error: "Username already taken" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const rows = await sql`
      INSERT INTO users (username, password_hash)
      VALUES (${username}, ${passwordHash})
      RETURNING id, username, best_score
    `;
    const user = rows[0];
    const token = signToken({ sub: user.id, username: user.username });
    res.status(201).json({ token, username: user.username, bestScore: user.best_score, avatarUrl: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
};
