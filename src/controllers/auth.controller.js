const authService = require("../services/auth.service");
const ApiResponse = require("../utils/ApiResponse");
const {
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} = require("../utils/tokenUtils");

// ─── REGISTER ─────────────────────────────────────────────────────────────────
// Controller's ONLY job: read req, call service, send res.
// No business logic here — all logic is in the service.
const register = async (req, res) => {
  const { username, email, password, fullName } = req.body;

  const { user, accessToken, refreshToken } = await authService.register({
    username,
    email,
    password,
    fullName,
  });

  // Set refresh token as httpOnly cookie
  setRefreshTokenCookie(res, refreshToken);

  // Send access token in response body — client stores this in memory (not localStorage)
  // Why not localStorage? It's accessible by JS → XSS can steal it.
  // Best practice: store access token in memory (JS variable), refresh token in httpOnly cookie
  res
    .status(201) // 201 = Created
    .json(new ApiResponse(201, { user, accessToken }, "Account created successfully"));
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body;

  const { user, accessToken, refreshToken } = await authService.login({
    email,
    password,
  });

  setRefreshTokenCookie(res, refreshToken);

  res
    .status(200)
    .json(new ApiResponse(200, { user, accessToken }, "Logged in successfully"));
};

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
const logout = async (req, res) => {
  // req.user is set by the authenticate middleware
  // authenticate middleware must run before this controller
  await authService.logout(req.user._id);

  // Clear the httpOnly cookie
  clearRefreshTokenCookie(res);

  res
    .status(200)
    .json(new ApiResponse(200, null, "Logged out successfully"));
};

// ─── REFRESH TOKEN ────────────────────────────────────────────────────────────
const refreshToken = async (req, res) => {
  // Read refresh token from the httpOnly cookie
  // req.cookies is populated by cookieParser() middleware (registered in app.js)
  const incomingRefreshToken = req.cookies?.refreshToken;

  const { accessToken, refreshToken: newRefreshToken } =
    await authService.refreshAccessToken(incomingRefreshToken);

  // Rotate the cookie with the new refresh token
  setRefreshTokenCookie(res, newRefreshToken);

  res
    .status(200)
    .json(new ApiResponse(200, { accessToken }, "Token refreshed successfully"));
};

// ─── GET CURRENT USER ─────────────────────────────────────────────────────────
// Returns the currently logged-in user's profile.
// authenticate middleware already fetched user and attached to req.user
const getMe = async (req, res) => {
  // req.user is already populated by authenticate middleware
  // No DB call needed here — middleware already did it
  res
    .status(200)
    .json(new ApiResponse(200, { user: req.user }, "Current user fetched"));
};

module.exports = { register, login, logout, refreshToken, getMe };