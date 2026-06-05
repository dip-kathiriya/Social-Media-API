const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/tokenUtils");

// ─── REGISTER ─────────────────────────────────────────────────────────────────
// Business logic for creating a new user.
// Controller calls this — service doesn't touch req/res.
const register = async ({ username, email, password, fullName }) => {

  // Check if email already taken — give a clear error before Mongoose throws
  // (Mongoose would throw code 11000, but the message is less clear)
  const existingEmail = await User.findOne({ email: email.toLowerCase() });
  if (existingEmail) {
    throw new ApiError(409, "Email already registered"); // 409 = Conflict
  }

  // Check if username already taken
  const existingUsername = await User.findOne({ username: username.toLowerCase() });
  if (existingUsername) {
    throw new ApiError(409, "Username already taken");
  }

  // Create user — password hashing happens automatically in the pre("save") hook
  // we defined in the User model. We don't hash here — that's the model's job.
  const user = await User.create({
    username,
    email,
    password,
    fullName: fullName || "",
  });

  // Generate tokens immediately so user is logged in right after register
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Store refresh token in DB — hashed would be more secure but adds complexity
  // We store it so we can invalidate it on logout
  // Using .save() here triggers the pre("save") hook, but isModified("password")
  // returns false so the password won't be re-hashed — only refreshToken is changed
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  // validateBeforeSave: false → skip running all validators again
  // We already validated on create; no need to validate again on token update

  // Return user without sensitive fields
  // .toObject() converts Mongoose document to plain JS object
  // We then manually remove fields we don't want to expose
  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.refreshToken;

  return { user: userResponse, accessToken, refreshToken };
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const login = async ({ email, password }) => {

  // Find user by email and explicitly SELECT password (it has select:false)
  // We MUST add "+password" here — without it, password won't be returned
  // and bcrypt comparison will fail
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  if (!user) {
    // IMPORTANT: Don't say "email not found" — that leaks which emails exist
    // Always use the same message for wrong email AND wrong password
    // This prevents "user enumeration" attacks
    throw new ApiError(401, "Invalid email or password");
  }

  // Check if account is active
  if (!user.isActive) {
    throw new ApiError(401, "Your account has been deactivated");
  }

  // Compare provided password against the stored hash
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid email or password"); // Same message — intentional
  }

  // Generate fresh tokens on every login
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Update refresh token in DB — rotate it on every login
  // Token rotation means each login invalidates the previous refresh token
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.refreshToken;

  return { user: userResponse, accessToken, refreshToken };
};

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
// Logout means: delete refresh token from DB + clear the cookie
// The access token will expire on its own (15 min) — we can't "revoke" a JWT
// unless we maintain a blacklist (adds complexity, not worth it for 15min tokens)
const logout = async (userId) => {
  // Remove refresh token from DB — this token can never be used again
  await User.findByIdAndUpdate(
    userId,
    { $unset: { refreshToken: 1 } }, // $unset removes the field entirely
    { new: true }
  );
  // Even if someone has the cookie with the old refresh token,
  // the DB no longer has it, so /auth/refresh will reject it
};

// ─── REFRESH ACCESS TOKEN ─────────────────────────────────────────────────────
// Called when access token expires.
// Client sends the refresh token (from httpOnly cookie) → we issue a new access token.
const refreshAccessToken = async (incomingRefreshToken) => {

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token required");
  }

  // Verify the refresh token is valid and not expired
  let decoded;
  try {
    decoded = verifyRefreshToken(incomingRefreshToken);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new ApiError(401, "Refresh token expired. Please log in again");
    }
    throw new ApiError(401, "Invalid refresh token");
  }

  // Find the user and get their stored refresh token
  const user = await User.findById(decoded.id).select("+refreshToken");

  if (!user) {
    throw new ApiError(401, "User not found");
  }

  // Compare the incoming token with what's stored in DB
  // If they don't match, someone is using an old/stolen token
  // (because we rotate refresh tokens — each login/refresh creates a new one)
  if (user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is invalid or already used");
  }

  // Issue a new access token
  const newAccessToken = generateAccessToken(user._id);

  // Optionally rotate the refresh token too (more secure)
  // Each refresh gives a new refresh token, old one is deleted
  const newRefreshToken = generateRefreshToken(user._id);
  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

module.exports = { register, login, logout, refreshAccessToken };