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
  type: Number,   // 👈 better
  min: 0
},
role: {
  type: String,
  enum: ["part-time", "full-time", "both"],
  default: "both"
}


}, { timestamps: true });


module.exports = mongoose.model("Teacher", teacherSchema);

  
