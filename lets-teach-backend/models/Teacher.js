const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: true
    },
    phone: {
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
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Teacher", teacherSchema);

  
