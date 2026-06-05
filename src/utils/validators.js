// ─── CORE VALIDATION PRIMITIVES ───────────────────────────────────────────────
// These are small, pure functions that check one thing each.
// Pure means: same input always gives same output, no side effects.
// We compose these to build complex validators.

// Check if a value is present (not undefined, null, or empty string)
const isRequired = (value, fieldName) => {
  if (value === undefined || value === null || String(value).trim() === "") {
    return `${fieldName} is required`;
  }
  return null; // null means no error
};

// Check minimum string length
const minLength = (value, min, fieldName) => {
  if (String(value).trim().length < min) {
    return `${fieldName} must be at least ${min} characters`;
  }
  return null;
};

// Check maximum string length
const maxLength = (value, max, fieldName) => {
  if (String(value).trim().length > max) {
    return `${fieldName} cannot exceed ${max} characters`;
  }
  return null;
};

// Validate email format using regex
// This regex covers 99.9% of real-world email formats
const isEmail = (value, fieldName) => {
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(String(value).toLowerCase())) {
    return `${fieldName} must be a valid email address`;
  }
  return null;
};

// Validate username — only letters, numbers, underscores, dots
const isValidUsername = (value, fieldName) => {
  const usernameRegex = /^[a-zA-Z0-9_.]+$/;
  if (!usernameRegex.test(value)) {
    return `${fieldName} can only contain letters, numbers, underscores, and dots`;
  }
  return null;
};

// Validate URL format (for social links, avatar etc.)
const isValidUrl = (value, fieldName) => {
  try {
    new URL(value); // Built-in JS URL constructor throws if invalid
    return null;
  } catch {
    return `${fieldName} must be a valid URL`;
  }
};

// ─── COLLECT ERRORS HELPER ────────────────────────────────────────────────────
// Takes an array of validation results (strings or nulls)
// Filters out nulls and returns only the actual error messages
// Usage: collectErrors([isRequired(x), minLength(x, 3)])
const collectErrors = (checks) => {
  // filter(Boolean) removes null/undefined/false from array
  // "Hello" → truthy (kept), null → falsy (removed)
  return checks.filter(Boolean);
};

module.exports = {
  isRequired,
  minLength,
  maxLength,
  isEmail,
  isValidUsername,
  isValidUrl,
  collectErrors,
};