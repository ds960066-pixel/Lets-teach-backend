const mongoose = require("mongoose");

const inviteSchema = new mongoose.Schema(
  {
    fromType: {
      type: String,
      enum: ["teacher", "institute"],
      required: true,
    },
    fromUid: {
      type: String,
      required: true,
      index: true,
    },

    toType: {
      type: String,
      enum: ["teacher", "institute"],
      required: true,
    },
    toUid: {
      type: String,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
      index: true,
    },

    acceptedAt: {
      type: Date,
    },

    rejectedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invite", inviteSchema);
