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
