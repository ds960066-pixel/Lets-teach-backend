const mongoose = require("mongoose");

const blockSchema = new mongoose.Schema(
  {
    blockerType: String,
    blockerUid: String,
    blockedType: String,
    blockedUid: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Block", blockSchema);
