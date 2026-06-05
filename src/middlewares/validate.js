const ApiError = require("../utils/ApiError");

// ─── VALIDATE MIDDLEWARE FACTORY ──────────────────────────────────────────────
// A "factory" function returns another function.
// validate(validatorFn) returns a middleware function.
// This pattern lets us write: router.post("/register", validate(registerValidator), controller)
//
// Why a factory? Because each route needs a DIFFERENT validator.
// Instead of writing a new middleware for each route, we write one factory
// that accepts any validator function and wraps it in middleware behavior.

const validate = (validatorFn) => {
  // This is the actual middleware Express will call
  return (req, res, next) => {
    // Call the validator with req.body — it returns an array of error strings
    const errors = validatorFn(req.body);

    if (errors.length > 0) {
      // Validation failed — throw ApiError with ALL errors at once
      // The client sees every problem in one response, not one at a time
      // 422 = Unprocessable Entity — semantically correct for validation errors
      throw new ApiError(422, "Validation failed", errors);
    }

    // No errors — continue to controller
    next();
  };
};

module.exports = validate;