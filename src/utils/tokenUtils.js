const jwt = require("jsonwebtoken");

// ─── GENERATE ACCESS TOKEN ────────────────────────────────────────────────────
// Access token is short-lived and carries the user's identity.
// We only store userId in the payload — nothing sensitive.
// The client sends this in every request: Authorization: Bearer <token>
const generateAccessToken = (userId) => {
  return jwt.sign(
    { id: userId },                          // Payload — what we embed in the token
    process.env.JWT_ACCESS_SECRET,           // Secret key used to sign the token
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN } // "15m", "1h", "7d" etc.
  );
  // jwt.sign() internally:
  // 1. Creates header: { alg: "HS256", typ: "JWT" }
  // 2. Base64url-encodes header + payload
  // 3. Creates HMAC-SHA256 signature using the secret
  // 4. Returns: base64(header).base64(payload).signature
};

// ─── GENERATE REFRESH TOKEN ───────────────────────────────────────────────────
// Refresh token is long-lived and ONLY used to get a new access token.
// It's stored in the DB (on the user document) so we can invalidate it on logout.
// Stored in httpOnly cookie so JS can't read it — XSS protection.
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,          // Different secret than access token
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
  );
};

// ─── VERIFY ACCESS TOKEN ──────────────────────────────────────────────────────
// jwt.verify() does two things:
// 1. Checks the signature — was this token created with our secret?
// 2. Checks expiry — has the token expired?
// If either fails, it throws a JsonWebTokenError or TokenExpiredError
const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  // Returns the decoded payload: { id: "userId", iat: 123, exp: 456 }
};

// ─── VERIFY REFRESH TOKEN ────────────────────────────────────────────────────
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

// ─── SET REFRESH TOKEN COOKIE ────────────────────────────────────────────────
// We send the refresh token as an httpOnly cookie — not in the response body.
// httpOnly = browser stores it, but JS cannot access it via document.cookie
// This is the standard protection against XSS stealing the refresh token.
const setRefreshTokenCookie = (res, token) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,    // JS cannot read this cookie — XSS protection
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "strict", // Cookie only sent for same-site requests — CSRF protection
                        // sameSite:"strict" = cookie won't be sent on cross-site requests
                        // This prevents CSRF (Cross-Site Request Forgery) attacks
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
                                       // maxAge is in ms, JWT expiresIn is in string format
  });
};

// ─── CLEAR REFRESH TOKEN COOKIE ──────────────────────────────────────────────
// On logout, we clear the cookie by setting maxAge to 0
const clearRefreshTokenCookie = (res) => {
  res.cookie("refreshToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0, // Immediately expire the cookie
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
};