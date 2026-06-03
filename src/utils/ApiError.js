// ApiError extends the built-in JavaScript Error class
// This means it IS an Error, but with extra fields we control
class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    // super(message) calls the parent Error constructor
    // This sets error.message and captures the stack trace
    super(message);

    this.statusCode = statusCode;  // HTTP status (400, 401, 404, 500)
    this.success = false;          // Always false for errors
    this.errors = errors;          // Array of detailed errors (e.g. validation errors)
  }
}

module.exports = ApiError;