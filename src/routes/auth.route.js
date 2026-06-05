const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const authenticate = require("../middlewares/authenticate");
const validate = require("../middlewares/validate");
const {
  validateRegister,
  validateLogin,
} = require("../validators/auth.validator");

// validate(validateRegister) runs BEFORE authController.register
// If validation fails → 422 error returned, controller never called
// If validation passes → next() called → controller runs


// Public routes — no auth required
// POST /api/v1/auth/register
router.post("/register", validate(validateRegister), authController.register);

// POST /api/v1/auth/login
router.post("/login", validate(validateLogin), authController.login);

// POST /api/v1/auth/refresh
// Uses httpOnly cookie — no token in header needed
router.post("/refresh", authController.refreshToken);

// Protected routes — authenticate middleware runs first
// POST /api/v1/auth/logout
router.post("/logout", authenticate, authController.logout);

// GET /api/v1/auth/me
router.get("/me", authenticate, authController.getMe);

module.exports = router;