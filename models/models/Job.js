const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    instituteUid: {
      type: String,
      required: true,
    },
    instituteName: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["part-time", "full-time", "both"],
      default: "both",
    },
    experienceRequired: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);
