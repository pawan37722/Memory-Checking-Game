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

    await ensureSchema();
    const sql = getSql();
    const rows = await sql`
      SELECT id, username, password_hash, best_score, avatar_url FROM users WHERE username = ${username}
    `;
    if (rows.length === 0) {
      // Distinct code so the UI can show "that username doesn't exist" instead
      // of a generic error. (Trade-off: this lets someone probe which
      // usernames are registered - acceptable here since the app has no
      // sensitive data behind it, but worth knowing if you reuse this code
      // elsewhere.)
      return res.status(404).json({ code: "USERNAME_NOT_FOUND", error: "That username doesn't exist" });
    }

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ code: "WRONG_PASSWORD", error: "Incorrect password" });
    }

    const token = signToken({ sub: user.id, username: user.username });
    res.status(200).json({
      token,
      username: user.username,
      bestScore: user.best_score,
      avatarUrl: user.avatar_url || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
};
