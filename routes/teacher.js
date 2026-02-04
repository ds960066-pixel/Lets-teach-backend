const express = require("express");
const router = express.Router();
const Teacher = require("../models/Teacher");
const upload = require("../utils/uploadResume");

/* ======================================
   LOGIN CHECK (TEACHER)
   GET /api/teacher/login-check/:uid
====================================== */
router.get("/login-check/:uid", async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ uid: req.params.uid });

    if (!teacher) return res.json({ status: "REGISTER_REQUIRED" });
    if (teacher.isBlocked) return res.json({ status: "BLOCKED" });

    return res.json({ status: "OK" });
  } catch (err) {
    console.error("Teacher login-check error:", err);
    return res.status(500).json({ status: "ERROR" });
  }
});

/* ======================================
   CREATE TEACHER
   POST /api/teacher/create
====================================== */
router.post("/create", async (req, res) => {
  try {
    const { uid, name, phone, subject, city, experience, role } = req.body;

    if (!uid || !name || !phone || !subject || !city) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled"
      });
    }

    const existing = await Teacher.findOne({ uid });
    if (existing) {
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
    });

    await teacher.save();

    return res.json({ success: true, teacher });
  } catch (err) {
    console.error("Teacher create error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
