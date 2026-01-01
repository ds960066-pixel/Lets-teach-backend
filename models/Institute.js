const mongoose = require("mongoose");

const instituteSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
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

    // ✅ YAHAN ANDAR ADD KARNA THA
    registered: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Institute", instituteSchema);
