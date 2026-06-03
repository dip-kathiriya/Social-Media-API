// Import mongoose — the library that connects Node.js to MongoDB
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // mongoose.connect() opens a connection pool to MongoDB
    // A connection pool means multiple requests can use DB simultaneously
    // without waiting for each other — this is critical for performance
    const conn = await mongoose.connect(process.env.MONGO_URI);

    // conn.connection.host tells us which MongoDB host we connected to
    // Useful to confirm we're hitting the right DB (local vs cloud)
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // If DB connection fails, the entire app is useless
    // So we log the error and forcefully exit the Node process
    // process.exit(1) means "exit with failure code"
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

// Export so server.js can call this before starting HTTP server
module.exports = connectDB;