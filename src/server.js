// Load environment variables from .env file FIRST
// Must be before any other require() that uses process.env
const dotenv = require("dotenv");
dotenv.config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

// Connect to MongoDB first, THEN start the HTTP server
// If DB fails, we don't want an HTTP server running with no DB
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
});