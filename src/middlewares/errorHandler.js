const ApiError = require("../utils/ApiError");

// Express identifies error-handling middleware by the 4-argument signature
// (err, req, res, next) — this is a hard rule in Express
const errorHandler = (err, req, res, next) => {

  // If the error is already our ApiError, use its statusCode
  // Otherwise default to 500 (Internal Server Error)
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Mongoose throws a specific error type when you pass a bad MongoDB ObjectId
  // e.g. /users/not-a-valid-id — instead of crashing, we return 400
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
  }

  // Mongoose throws code 11000 when a unique field (like email) already exists
  // We catch this and return a friendly message instead of a raw DB error
  if (err.code === 11000) {
    statusCode = 400;
    // Object.keys(err.keyValue)[0] extracts which field caused the duplicate
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists`;
  }

  // Mongoose ValidationError happens when schema validators fail
  // e.g. required field missing, string too short, etc.
  if (err.name === "ValidationError") {
    statusCode = 400;
    // err.errors is an object — we extract all messages into an array
    message = Object.values(err.errors).map((e) => e.message).join(", ");
  }

  // Send the standardized error response back to the client
  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || [],
    // Only show stack trace in development — never expose it in production
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;