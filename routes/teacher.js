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
      role,
      verificationStatus: "unverified"
    });

    await teacher.save();

    return res.json({ success: true, teacher });
  } catch (err) {
    console.error("Teacher create error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* ======================================
   SAVE / UPDATE RESUME (TEXT DATA) ✅ FINAL
   POST /api/teacher/resume/:uid
====================================== */
router.post("/resume/:uid", async (req, res) => {
  try {
    const { about, education, skills } = req.body;
    const uid = req.params.uid;

    if (!about || !education || !skills) {
      return res.status(400).json({
        success: false,
        message: "All resume fields are required"
      });
    }

    const teacher = await Teacher.findOne({ uid });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found"
      });
    }

    teacher.about = about;
    teacher.education = education;
    teacher.skills = Array.isArray(skills)
      ? skills
      : String(skills)
          .split(",")
          .map(s => s.trim())
          .filter(Boolean);

    await teacher.save();

    return res.json({
      success: true,
      message: "Resume saved successfully"
    });
  } catch (err) {
    console.error("Resume save error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* ======================================
   UPLOAD RESUME PDF
   POST /api/teacher/upload-resume/:uid
====================================== */
router.post(
  "/upload-resume/:uid",
  upload.single("resume"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded"
        });
      }

      const resumeUrl = `/uploads/${req.file.filename}`;

      await Teacher.updateOne(
        { uid: req.params.uid },
        { resumeUrl }
      );

      return res.json({
        success: true,
        message: "Resume uploaded successfully",
        resumeUrl
      });
    } catch (err) {
      console.error("Resume upload error:", err);
      return res.status(500).json({
        success: false,
        message: "Upload failed"
      });
    }
  }
);

/* ======================================
   GET TEACHER PROFILE
   GET /api/teacher/:uid
====================================== */
router.get("/:uid", async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ uid: req.params.uid });
    if (!teacher) {
      return res.status(404).json({ success: false });
    }

    return res.json({ success: true, teacher });
  } catch (err) {
    console.error("Get teacher error:", err);
    return res.status(500).json({ success: false });
  }
});

module.exports = router;
