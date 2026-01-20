const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    instituteUid: {
      type: String,
      required: true,
      index: true
    },

    title: {
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

    role: {
      type: String,
      enum: ["part-time", "full-time", "both"],
      default: "both"
    },

    salary: {
      type: String,
      trim: true
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000
    },

    // ✅ Posting date (show on jobs page)
    // Best: auto set by backend (avoid fake dates)
    postedAt: {
      type: Date,
      default: Date.now,
      index: true
    },

    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
      index: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);
