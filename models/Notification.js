const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userUid: {
      type: String,
      required: true,
      index: true
    },

    userType: {
      type: String,
      enum: ["teacher", "institute"],
      required: true
    },

    title: {
      type: String,
      required: true
    },

    message: {
      type: String,
      required: true
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
