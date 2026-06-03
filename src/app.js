// express-async-errors patches Express internally so that if any async
// route handler throws an error, it automatically calls next(error)
// Without this, async errors would silently crash the server

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

// ─── SECURITY MIDDLEWARES ───────────────────────────────────────────────────

// helmet() sets ~14 security-related HTTP headers automatically
// e.g. X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security
// These prevent common attacks like clickjacking, MIME sniffing, etc.
app.use(helmet());

// cors() controls which domains can make requests to this API
// In production you'd replace * with your actual frontend domain
app.use(cors({
  origin: process.env.CLIENT_URL || "*",
  credentials: true, // Allow cookies to be sent cross-origin
}));

// ─── REQUEST PARSING MIDDLEWARES ───────────────────────────────────────────

// express.json() parses incoming requests with JSON body
// Without this, req.body would be undefined for POST/PUT requests
app.use(express.json({ limit: "10kb" })); // limit prevents huge payload attacks

// express.urlencoded() parses form data (application/x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// cookieParser() parses Cookie header and populates req.cookies
// We need this to read the refresh token cookie during token refresh
app.use(cookieParser());

// ─── LOGGING ───────────────────────────────────────────────────────────────

// morgan("dev") logs: METHOD /path STATUS ms - bytes
// e.g. GET /api/users 200 12.345 ms - 512
// Only log in development — in production use a proper logger like Winston
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ─── HEALTH CHECK ──────────────────────────────────────────────────────────

// Simple route to verify the server is alive
// Used by load balancers and monitoring tools
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// ─── API ROUTES (will add as we build) ─────────────────────────────────────
// app.use("/api/v1/auth", authRoutes);
// app.use("/api/v1/users", userRoutes);
// app.use("/api/v1/posts", postRoutes);

// ─── 404 HANDLER ───────────────────────────────────────────────────────────

// If no route matched above, this runs
// We create an ApiError and pass to error handler via next()
app.use((req, res, next) => {
  const ApiError = require("./utils/ApiError");
  next(new ApiError(404, `Route ${req.originalUrl} not found`));
});

// ─── GLOBAL ERROR HANDLER ──────────────────────────────────────────────────

// This MUST be the last middleware — Express only treats it as error handler
// because it has 4 parameters (err, req, res, next)
app.use(errorHandler);

module.exports = app;