const mongoose = require("mongoose");

const instituteSchema = new mongoose.Schema(
  {
    /* =========================
       BASIC DETAILS (EXISTING)
    ========================= */
    uid: {
      type: String,
      required: true,
      unique: true,
      index: true
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
      trim: true
    },

    subjectsNeeded: [
      {
        type: String,
        trim: true
      }
    ],

    /* =========================
       REGISTRATION FLAG (EXISTING)
    ========================= */
    registered: {
      type: Boolean,
      default: false
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
      type: Date
    },

    verificationNote: {
      type: String,
      trim: true
    },

    /* =========================
       SYSTEM SAFETY (FUTURE)
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
