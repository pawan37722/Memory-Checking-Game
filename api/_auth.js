const jwt = require("jsonwebtoken");

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable is not set");
  return secret;
}

function signToken(payload) {
  return jwt.sign(payload, getSecret(), { expiresIn: "7d" });
}

function verifyToken(token) {
  return jwt.verify(token, getSecret());
}

function getTokenFromReq(req) {
  const header = req.headers["authorization"] || req.headers["Authorization"];
  if (!header || !header.startsWith("Bearer ")) return null;
  return header.slice(7);
}

// Verifies the request's JWT. On failure, writes the error response itself
// and returns null — callers should `return` immediately when this is null.
function requireAuth(req, res) {
  const token = getTokenFromReq(req);
  if (!token) {
    res.status(401).json({ error: "Missing token" });
    return null;
  }
  try {
    return verifyToken(token);
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
    return null;
  }
}

module.exports = { signToken, verifyToken, getTokenFromReq, requireAuth };
