const { getSql, ensureSchema } = require("./_db");
const { requireAuth } = require("./_auth");

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB
// NOTE: this enforces the 50MB limit in application code. If you deploy to
// Vercel, Vercel's serverless functions reject request bodies over ~4.5MB
// *before* this code even runs (platform-level limit, not configurable on
// Hobby/Pro). Locally (npm start / server.js) the full 50MB works. For a
// production 50MB upload on Vercel you'd need direct-to-storage upload
// (e.g. Vercel Blob) instead of sending the file through this API route -
// ask if you want that wired up.

function parseBody(req) {
  return typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
}

// Rough decoded-size check for a base64 data: URL without actually decoding it.
function base64ByteLength(dataUrl) {
  const comma = dataUrl.indexOf(",");
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  const padding = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
  return Math.floor((b64.length * 3) / 4) - padding;
}

module.exports = async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  try {
    await ensureSchema();
    const sql = getSql();

    if (req.method === "GET") {
      const rows = await sql`SELECT avatar_url FROM users WHERE id = ${user.sub}`;
      return res.status(200).json({ avatarUrl: rows[0]?.avatar_url ?? null });
    }

    if (req.method === "POST") {
      const body = parseBody(req);
      const avatarUrl = String(body.avatarUrl || "");

      if (!avatarUrl.startsWith("data:image/")) {
        return res.status(400).json({ error: "avatarUrl must be a data:image/... URL" });
      }
      if (base64ByteLength(avatarUrl) > MAX_BYTES) {
        return res.status(413).json({ error: "Image is larger than the 50MB limit" });
      }

      const rows = await sql`
        UPDATE users SET avatar_url = ${avatarUrl} WHERE id = ${user.sub}
        RETURNING avatar_url
      `;
      return res.status(200).json({ avatarUrl: rows[0].avatar_url });
    }

    if (req.method === "DELETE") {
      await sql`UPDATE users SET avatar_url = NULL WHERE id = ${user.sub}`;
      return res.status(200).json({ avatarUrl: null });
    }

    res.setHeader("Allow", "GET, POST, DELETE");
    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Profile update failed" });
  }
};
