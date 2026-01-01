const mongoose = require("mongoose");

const instituteSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: true,
      unique: true, // Firebase UID
    },
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    address: {
      type: String,
    },
    subjectsNeeded: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);
registered: {
  type: Boolean,
  default: false
}


module.exports = mongoose.model("Institute", instituteSchema);
