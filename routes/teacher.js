const express = require("express");
const router = express.Router();
const Teacher = require("../models/Teacher");
const upload = require("../utils/uploadResume");

const verifyToken = require("../middleware/verifyToken");
const requireRole = require("../middleware/requireRole");

/* ======================================
   GET LOGGED-IN TEACHER PROFILE
   GET /api/teacher/me
====================================== */
router.get(
  "/me",
  verifyToken,
  requireRole("teacher"),
  async (req, res) => {
    try {
      const teacher = await Teacher.findById(req.user.id);

      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: "Teacher not found"
        });
      }

      return res.json({
        success: true,
        teacher
      });

    } catch (err) {
      console.error("Get profile error:", err);
      return res.status(500).json({
        success: false,
        message: "Server error"
      });
    }
  }
);


/* ======================================
   UPDATE PROFILE
   POST /api/teacher/update-profile
====================================== */
router.post(
  "/update-profile",
  verifyToken,
  requireRole("teacher"),
  async (req, res) => {
    try {

      const { phone, subject, city, experience } = req.body;

      const teacher = await Teacher.findById(req.user.id);

      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: "Teacher not found"
        });
      }

      if (phone) teacher.phone = phone;
      if (subject) teacher.subject = subject;
      if (city) teacher.city = city;
      if (experience !== undefined) teacher.experience = experience;

      await teacher.save();

      return res.json({
        success: true,
        message: "Profile updated"
      });

    } catch (err) {
      console.error("Update profile error:", err);
      return res.status(500).json({
        success: false,
        message: "Server error"
      });
    }
  }
);


/* ======================================
   SAVE RESUME DETAILS
   POST /api/teacher/resume
====================================== */
router.post(
  "/resume",
  verifyToken,
  requireRole("teacher"),
  async (req, res) => {
    try {

      const { about, education, skills } = req.body;

      if (!about || !education || !skills) {
        return res.status(400).json({
          success: false,
          message: "All resume fields required"
        });
      }

      const teacher = await Teacher.findById(req.user.id);

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
  }
);


/* ======================================
   UPLOAD RESUME PDF
   POST /api/teacher/upload-resume
====================================== */
router.post(
  "/upload-resume",
  verifyToken,
  requireRole("teacher"),
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

      await Teacher.findByIdAndUpdate(
        req.user.id,
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

module.exports = router;