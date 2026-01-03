const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema(
  {
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

    subject: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    city: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    experience: {
      type: Number,
      min: 0
    },

    role: {
      type: String,
      enum: ["part-time", "full-time", "both"],
      default: "both"
    },

    /* ===== ADMIN VERIFICATION ===== */
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

    /* ===== PORTFOLIO (FUTURE) ===== */
    about: {
      type: String,
      maxlength: 1000,
      trim: true
    },

    skills: [
      {
        type: String,
        trim: true
      }
    ],

    education: {
      type: String,
      trim: true
    },

    resumeUrl: {
      type: String
    },

    /* ===== SAFETY ===== */
    isBlocked: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Teacher", teacherSchema);
