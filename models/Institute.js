const mongoose = require("mongoose");

const instituteSchema = new mongoose.Schema(
  {
    /* =========================
       BASIC DETAILS
    ========================= */
    uid: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    /* ===== NEW AUTH FIELDS (MIGRATION SAFE) ===== */
    email: {
      type: String,
      unique: true,
      sparse: true,   // allows old docs without email
      lowercase: true,
      trim: true
    },

    password: {
      type: String
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    phone: {
      type: String,
      required: true,
      trim: true
    },

    city: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    address: {
      type: String,
      trim: true,
      default: ""
    },

    subjectsNeeded: [
      {
        type: String,
        trim: true
      }
    ],

    /* =========================
       REGISTRATION FLAG
    ========================= */
    registered: {
      type: Boolean,
      default: true
    },

    /* =========================
       VERIFICATION (ADMIN)
    ========================= */
    verificationStatus: {
      type: String,
      enum: ["unverified", "verified", "rejected"],
      default: "unverified",
      index: true
    },

    verifiedAt: {
      type: Date,
      default: null
    },

    verificationNote: {
      type: String,
      trim: true
    },

    /* =========================
       SAFETY
    ========================= */
    isBlocked: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Institute", instituteSchema);