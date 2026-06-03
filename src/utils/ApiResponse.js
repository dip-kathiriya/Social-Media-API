// This class represents a successful API response
// Instead of writing res.json({ success: true, data: ... }) everywhere,
// we create this once and reuse it across all controllers
class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;  // HTTP status code (200, 201, etc.)
    this.success = true;           // Always true for ApiResponse (errors use ApiError)
    this.message = message;        // Human-readable message
    this.data = data;              // The actual payload
  }
}

module.exports = ApiResponse;