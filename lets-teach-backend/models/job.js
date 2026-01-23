const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    instituteUid: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    subject: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    experience: {
      type: String
    },
    role: {
      type: String,
      enum: ["part-time", "full-time", "both"],
      default: "both"
    },
    description: {
      type: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);
