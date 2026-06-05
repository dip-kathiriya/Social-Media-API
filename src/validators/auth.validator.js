const {
  isRequired,
  minLength,
  maxLength,
  isEmail,
  isValidUsername,
  collectErrors,
} = require("../utils/validators");

// ─── REGISTER VALIDATOR ───────────────────────────────────────────────────────
// Called with req.body — returns array of error strings (empty = valid)
const validateRegister = (body) => {
    console.log("BODY RECEIVED:", body); // ← add this
  const { username, email, password, fullName } = body;

  return collectErrors([
    // Username checks
    isRequired(username, "Username"),
    username && minLength(username, 3, "Username"),
    username && maxLength(username, 30, "Username"),
    username && isValidUsername(username, "Username"),

    // Email checks
    isRequired(email, "Email"),
    email && isEmail(email, "Email"),

    // Password checks
    isRequired(password, "Password"),
    password && minLength(password, 8, "Password"),
    password && maxLength(password, 64, "Password"),
    // maxLength on password: extremely long passwords can cause bcrypt to hang
    // bcrypt has a 72-byte input limit — anything beyond is silently truncated
    // So we validate max 64 chars to stay safely within bcrypt's limit

    // fullName is optional — only validate if provided
    fullName && maxLength(fullName, 50, "Full name"),
  ]);
  // collectErrors filters out nulls (passing checks) and false values
  // (the && short-circuits when field is empty — avoids running checks on undefined)
};

// ─── LOGIN VALIDATOR ──────────────────────────────────────────────────────────
const validateLogin = (body) => {
  const { email, password } = body;

  return collectErrors([
    isRequired(email, "Email"),
    email && isEmail(email, "Email"),
    isRequired(password, "Password"),
  ]);
  // Note: we don't check password minLength on login
  // We don't want to give attackers hints about password requirements
};

// ─── UPDATE PROFILE VALIDATOR ─────────────────────────────────────────────────
const validateUpdateProfile = (body) => {
  const { fullName, bio, username } = body;

  return collectErrors([
    // All fields optional on update — only validate if provided
    fullName && maxLength(fullName, 50, "Full name"),
    bio && maxLength(bio, 160, "Bio"),
    username && minLength(username, 3, "Username"),
    username && maxLength(username, 30, "Username"),
    username && isValidUsername(username, "Username"),
  ]);
};

// ─── CHANGE PASSWORD VALIDATOR ────────────────────────────────────────────────
const validateChangePassword = (body) => {
  const { currentPassword, newPassword } = body;

  const errors = collectErrors([
    isRequired(currentPassword, "Current password"),
    isRequired(newPassword, "New password"),
    newPassword && minLength(newPassword, 8, "New password"),
    newPassword && maxLength(newPassword, 64, "New password"),
  ]);

  // Cross-field validation — can't do this with simple primitives
  // Check that new password is different from current
  if (currentPassword && newPassword && currentPassword === newPassword) {
    errors.push("New password must be different from current password");
  }

  return errors;
};

module.exports = {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
};