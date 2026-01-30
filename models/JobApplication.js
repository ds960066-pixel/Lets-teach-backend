const mongoose = require("mongoose");

const jobApplicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true
    },

    teacherUid: {
      type: String,
      required: true,
      index: true
    },
    resumeSnapshot: {
  about: String,
  skills: [String],
  education: String
},


    instituteUid: {
      type: String,
      required: true,
      index: true
    },

    status: {
      type: String,
      enum: ["applied", "shortlisted", "rejected"],
      default: "applied",
      index: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("JobApplication", jobApplicationSchema);
