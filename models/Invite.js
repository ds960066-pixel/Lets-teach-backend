const mongoose = require("mongoose");

const inviteSchema = new mongoose.Schema(
  {
    instituteUid: {
      type: String,
      required: true,
    },
    teacherUid: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invite", inviteSchema);
