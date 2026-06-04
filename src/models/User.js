const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

// ─── SUB-SCHEMA: Social Links ────────────────────────────────────────────────
// We embed this because it's small, bounded, and always read with the user.
// A sub-schema (nested object) is NOT a separate collection — it lives
// inside the User document itself in MongoDB.
const socialLinksSchema = new mongoose.Schema(
  {
    twitter:  { type: String, default: "" },
    instagram:{ type: String, default: "" },
    linkedin: { type: String, default: "" },
    website:  { type: String, default: "" },
  },
  { _id: false } // _id: false → mongoose won't add an _id to this sub-document
                 // We don't need IDs for embedded objects that are never queried alone
);

// ─── MAIN USER SCHEMA ────────────────────────────────────────────────────────
// A Schema is a blueprint — it defines the shape, types, constraints,
// and behavior of documents in the "users" collection.
// It does NOT touch the database — it's just a JS object describing structure.
const userSchema = new mongoose.Schema(
  {
    // ── Identity ──────────────────────────────────────────────────────────────

    username: {
      type: String,
      required: [true, "Username is required"],  // [value, error message]
      unique: true,       // Creates a unique index in MongoDB automatically
                          // unique: true on schema = MongoDB enforces no duplicates at DB level
      trim: true,         // Removes leading/trailing whitespace before saving
      lowercase: true,    // Converts to lowercase before saving — "Dip" → "dip"
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
      // match validates with a regex. This allows only letters, numbers, underscores, dots
      match: [/^[a-zA-Z0-9_.]+$/, "Username can only contain letters, numbers, underscores, and dots"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,       // Unique index — no two users can share an email
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,  // CRITICAL — select: false means this field is NEVER returned
                      // in queries by default. You must explicitly ask for it:
                      // User.findOne().select("+password")
                      // This prevents accidentally leaking password hashes in API responses
    },

    // ── Profile ───────────────────────────────────────────────────────────────

    fullName: {
      type: String,
      trim: true,
      maxlength: [50, "Full name cannot exceed 50 characters"],
      default: "",
    },

    bio: {
      type: String,
      maxlength: [160, "Bio cannot exceed 160 characters"], // Twitter-style limit
      default: "",
    },

    avatar: {
      type: String,   // We store the URL/path as a string, not the actual file
                      // Actual files go to cloud storage (Cloudinary, S3, R2)
                      // The DB just holds the reference URL
      default: "",
    },

    coverImage: {
      type: String,
      default: "",
    },

    socialLinks: {
      type: socialLinksSchema,  // Embedded sub-document using the schema above
      default: () => ({}),      // Default to empty object — triggers schema defaults
    },

    // ── Social Graph (Counts only — actual lists live in a Follow model) ──────
    // WHY NOT embed follower IDs here?
    // If a user has 1 million followers, that's 1 million ObjectIds (12 bytes each)
    // = 12MB inside ONE document. MongoDB document size limit is 16MB.
    // Also, every time someone follows/unfollows, you'd rewrite the entire array.
    // Solution: store COUNTS here (cheap to read), store relationships in a separate
    // Follow collection (cheap to update).

    followersCount: {
      type: Number,
      default: 0,
      min: 0,         // min/max are validators — prevents going below 0
    },

    followingCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    postsCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ── Auth & Security ───────────────────────────────────────────────────────

    refreshToken: {
      type: String,
      select: false,    // Never returned in queries — same reason as password
    },

    isVerified: {
      type: Boolean,
      default: false,   // Email verification status
    },

    isPrivate: {
      type: Boolean,
      default: false,   // Private accounts require follow approval
    },

    role: {
      type: String,
      enum: {
        values: ["user", "admin"],           // enum restricts to these exact values only
        message: "{VALUE} is not a valid role", // {VALUE} is replaced by the bad value
      },
      default: "user",
    },

    isActive: {
      type: Boolean,
      default: true,    // Soft delete flag — deactivated users are hidden, not deleted
    },

    passwordChangedAt: {
      type: Date,       // We store WHEN password was last changed
                        // If a JWT was issued BEFORE this date, it's invalid
                        // This lets us invalidate all tokens after a password change
    },
  },

  {
    // ── Schema Options ─────────────────────────────────────────────────────────

    timestamps: true,
    // timestamps: true automatically adds two fields to every document:
    // createdAt: Date  → set once when document is created
    // updatedAt: Date  → updated automatically every time document is saved
    // Under the hood Mongoose uses MongoDB's $currentDate operator for this

    toJSON: {
      virtuals: true,
      // virtuals: true means virtual fields (defined below) are included
      // when you call .toJSON() or res.json() on a document
    },

    toObject: {
      virtuals: true,   // Same but for .toObject() calls
    },
  }
);

// ─── INDEXES ─────────────────────────────────────────────────────────────────
// An index is a separate data structure (B-tree) that MongoDB maintains
// alongside your collection. Without an index, MongoDB does a COLLECTION SCAN
// — it reads EVERY document to find matches. With an index, it reads only
// the matching documents. At scale (millions of docs), this is the difference
// between 50ms and 5000ms.

// We already have indexes from unique:true on username and email.
// Here we add additional indexes for common query patterns:

// Text index for search — allows full-text search across username, fullName, bio
// MongoDB's text index tokenizes strings and enables $text queries
userSchema.index({ username: "text", fullName: "text", bio: "text" });

// Compound index for filtering active users sorted by creation time
// Compound means multiple fields in ONE index
// This serves queries like: "find all active users, newest first"
// Index field order matters — most selective field first (isActive has only 2 values,
// so it's less selective alone, but combined with createdAt it's efficient)
userSchema.index({ isActive: 1, createdAt: -1 });
// 1 = ascending, -1 = descending

// ─── VIRTUALS ────────────────────────────────────────────────────────────────
// A virtual is a computed field that is NOT stored in MongoDB.
// It's calculated on-the-fly from existing fields.
// Use case: you want a "profileUrl" field in API responses but don't want
// to store and sync it every time username changes.

userSchema.virtual("profileUrl").get(function () {
  // We use function() not arrow function here because we need `this`
  // `this` refers to the current document instance
  // Arrow functions don't bind their own `this`
  return `/users/${this.username}`;
});

// ─── MONGOOSE MIDDLEWARE (Hooks) ──────────────────────────────────────────────
// Middleware runs at specific points in a document's lifecycle.
// "pre" hooks run BEFORE the operation.
// "save" hook runs before document.save() is called.

// PASSWORD HASHING HOOK
// This ensures passwords are ALWAYS hashed before storing — you can't forget.
// Even if a developer calls user.save() directly, the hook fires.
userSchema.pre("save", async function (next) {
  // `this` = the document being saved

  // isModified("password") returns true only if password field was changed
  // This prevents re-hashing an already-hashed password on every save
  // e.g. if you update bio, password is unchanged, so skip hashing
  if (!this.isModified("password")) return next();

  // bcrypt.hash(password, saltRounds)
  // saltRounds = 12 means bcrypt runs 2^12 = 4096 iterations of its hashing function
  // More rounds = harder to brute-force, but slower to compute
  // 10-12 is the industry sweet spot for web APIs
  this.password = await bcrypt.hash(this.password, 12);

  next(); // Call next() to continue the save operation
});

// TRACK PASSWORD CHANGE TIME
// When password changes, record the timestamp.
// We'll use this to invalidate old JWT tokens.
userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  // this.isNew = true when document is being created for the first time
  // We subtract 1 second as a safety buffer — token issuance and DB write
  // can have slight timing differences; this ensures the comparison works correctly
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// ─── INSTANCE METHODS ─────────────────────────────────────────────────────────
// Instance methods are functions available on EVERY document instance.
// Call them like: const user = await User.findOne(...); user.comparePassword(...)

// Compare a plain-text password against the stored hash
// Used during login
userSchema.methods.comparePassword = async function (candidatePassword) {
  // bcrypt.compare(plain, hashed) → returns true if they match
  // We use this.password but remember password has select:false
  // This method is called on an instance that explicitly selected password
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if password was changed AFTER a JWT was issued
// jwtIssuedAt = the `iat` field from the decoded JWT (Unix timestamp in seconds)
userSchema.methods.wasPasswordChangedAfter = function (jwtIssuedAt) {
  if (this.passwordChangedAt) {
    // Convert passwordChangedAt (milliseconds) to seconds for comparison
    const changedAtSeconds = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    // If password was changed AFTER the token was issued, token is invalid
    return jwtIssuedAt < changedAtSeconds;
  }
  // No passwordChangedAt means password was never changed → token is still valid
  return false;
};

// ─── STATIC METHODS ──────────────────────────────────────────────────────────
// Static methods are called on the MODEL itself, not on a document instance.
// Call them like: User.findByEmail("dip@email.com")

userSchema.statics.findByEmail = function (email) {
  // `this` here refers to the User Model (not a document)
  return this.findOne({ email: email.toLowerCase() });
};

// ─── CREATE AND EXPORT THE MODEL ─────────────────────────────────────────────
// mongoose.model("User", userSchema) does two things:
// 1. Compiles the schema into a Model class
// 2. Maps the Model to a MongoDB collection named "users" (lowercase + pluralized)
//    "User" → "users" collection — Mongoose does this automatically
const User = mongoose.model("User", userSchema);

module.exports = User;