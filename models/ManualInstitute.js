const mongoose = require("mongoose");

const manualInstituteSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    city: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    phone: {
      type: String,
      trim: true
    },

    email: {
      type: String,
      trim: true,
      lowercase: true
    },

    isRegistered: {
      type: Boolean,
      default: false
    },

    linkedInstituteUid: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "ManualInstitute",
  manualInstituteSchema
);
