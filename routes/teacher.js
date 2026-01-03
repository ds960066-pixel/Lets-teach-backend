const express = require("express");
const router = express.Router();
const Teacher = require("../models/Teacher");

/* =================================================
   CREATE TEACHER
   POST /api/teacher/create
================================================= */
router.post("/create", async (req, res) => {
  try {
    const { uid, name, phone, subject, city, experience, role } = req.body;

    if (!uid || !name || !phone || !subject || !city) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled"
      });
    }

    const existingTeacher = await Teacher.findOne({ uid });
    if (existingTeacher) {
      return res.status(409).json({
        success: false,
        message: "Teacher already registered"
      });
    }

    const teacher = new Teacher({
      uid,
      name,
      phone,
      subject,
      city,
      experience,
      role
      // verificationStatus default = unverified
    });

    await teacher.save();

    res.json({
      success: true,
      message: "Teacher registered successfully",
      teacher
    });
  } catch (error) {
    console.error("Teacher create error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* =================================================
   PUBLIC BROWSE TEACHERS
   GET /api/teacher/browse
   ⚠️ ONLY VERIFIED TEACHERS
================================================= */
router.get("/browse", async (req, res) => {
  try {
