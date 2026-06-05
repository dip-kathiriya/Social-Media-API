const ApiError = require("../utils/ApiError");
const { verifyAccessToken } = require("../utils/tokenUtils");
const User = require("../models/User");

// ─── AUTHENTICATE MIDDLEWARE ──────────────────────────────────────────────────
// This middleware protects routes that require a logged-in user.
// It runs BEFORE the controller on protected routes.
// If valid → attaches user to req.user and calls next()
// If invalid → throws ApiError which flows to global error handler

const authenticate = async (req, res, next) => {
  // Step 1: Extract token from Authorization header
  // Standard format: "Authorization: Bearer eyJhbGci..."
  // req.headers.authorization gives us the full string "Bearer eyJhbGci..."
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // No token provided at all
    throw new ApiError(401, "Access token required");
  }

  // Split "Bearer eyJhbGci..." → ["Bearer", "eyJhbGci..."]
  // We want index [1] — the actual token
  const token = authHeader.split(" ")[1];

  // Step 2: Verify the token
  // verifyAccessToken throws if token is expired or tampered
  let decoded;
  try {
    decoded = verifyAccessToken(token);
    // decoded = { id: "userId", iat: 1234567, exp: 1234567 }
  } catch (err) {
    // JWT library throws specific error types:
    // TokenExpiredError → token is valid but expired
    // JsonWebTokenError → token is malformed or signature mismatch
    if (err.name === "TokenExpiredError") {
      throw new ApiError(401, "Access token expired");
    }
    throw new ApiError(401, "Invalid access token");
  }

  // Step 3: Check user still exists
  // Token could be valid but user was deleted from DB
  // We don't select password — we don't need it here
  const user = await User.findById(decoded.id).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(401, "User no longer exists");
  }

  // Step 4: Check if user is still active (not deactivated/banned)
  if (!user.isActive) {
    throw new ApiError(401, "Your account has been deactivated");
  }

  // Step 5: Check if password was changed after token was issued
  // decoded.iat = issued-at timestamp (Unix seconds)
  // If password changed AFTER token was issued, this token is no longer valid
  if (user.wasPasswordChangedAfter(decoded.iat)) {
    throw new ApiError(401, "Password was recently changed. Please log in again");
  }

  // Step 6: Attach user to request object
  // Now any controller after this middleware can access req.user
  // without fetching from DB again
  req.user = user;

  next(); // Continue to the actual route handler
};

module.exports = authenticate;