const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const authenticate = require("../middlewares/authenticate");

// Public routes — no auth required
// POST /api/v1/auth/register
router.post("/register", authController.register);

// POST /api/v1/auth/login
router.post("/login", authController.login);

// POST /api/v1/auth/refresh
// Uses httpOnly cookie — no token in header needed
router.post("/refresh", authController.refreshToken);

// Protected routes — authenticate middleware runs first
// POST /api/v1/auth/logout
router.post("/logout", authenticate, authController.logout);

// GET /api/v1/auth/me
router.get("/me", authenticate, authController.getMe);

module.exports = router;