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
});

/* ======================================
   🔥 PUBLIC TEACHERS (HOMEPAGE ALIAS)
   GET /api/teachers
====================================== */
router.get("/teachers", async (req, res) => {
  try {
    const filter = { isBlocked: false };

    if (req.query.city) filter.city = req.query.city;
    if (req.query.subject) filter.subject = req.query.subject;

    const teachers = await Teacher.find(filter).select(
      "uid name subject city experience role verificationStatus"
    );

    return res.json({ success: true, teachers });
  } catch (err) {
    console.error("Teachers alias error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ======================================
   PUBLIC BROWSE (NO LOGIN)
   GET /api/teacher/public
====================================== */
router.get("/public", async (req, res) => {
  try {
    const filter = { isBlocked: false };

    if (req.query.city) filter.city = req.query.city;
    if (req.query.subject) filter.subject = req.query.subject;

    const teachers = await Teacher.find(filter).select(
      "uid name subject city experience role verificationStatus"
    );

    return res.json({ success: true, teachers });
  } catch (err) {
    console.error("Teacher public browse error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ======================================
   BROWSE AFTER LOGIN
   GET /api/teacher/browse
====================================== */
router.get("/browse", async (req, res) => {
  try {
    const filter = { isBlocked: false };

    if (req.query.city) filter.city = req.query.city;
    if (req.query.subject) filter.subject = req.query.subject;

    const teachers = await Teacher.find(filter).select(
      "uid name subject city experience role verificationStatus"
    );

    return res.json({ success: true, teachers });
  } catch (err) {
    console.error("Teacher browse error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ======================================
   SAVE / UPDATE RESUME (JSON)
   POST /api/teacher/resume/:uid
====================================== */
router.post("/resume/:uid", async (req, res) => {
  try {
    const { about, education, skills } = req.body;

    const teacher = await Teacher.findOne({ uid: req.params.uid });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found"
      });
    }

    teacher.about = typeof about === "string" ? about.trim() : teacher.about;
    teacher.education =
      typeof education === "string" ? education.trim() : teacher.education;
    teacher.skills = Array.isArray(skills)
      ? skills.map(s => String(s).trim()).filter(Boolean)
      : teacher.skills;

    teacher.resume = teacher.resume || {};
    teacher.resume.summary = teacher.about || teacher.resume.summary;
    teacher.resume.education = teacher.education || teacher.resume.education;
    teacher.resume.skills = teacher.skills || teacher.resume.skills;

    teacher.resume.isComplete =
      !!teacher.about &&
      !!teacher.education &&
      Array.isArray(teacher.skills) &&
      teacher.skills.length > 0;

    await teacher.save();

    return res.json({
      success: true,
      message: "Resume saved successfully",
      resume: {
        about: teacher.about,
        education: teacher.education,
        skills: teacher.skills,
        isComplete: teacher.resume.isComplete,
        pdfUrl: teacher.resume.pdfUrl || null,
        resumeUrl: teacher.resumeUrl || null
      }
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
   UPLOAD RESUME (PDF)
   POST /api/teacher/upload-resume/:uid
====================================== */
router.post("/upload-resume/:uid", upload.single("resume"), async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ uid: req.params.uid });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Resume PDF required"
      });
    }

    const fileUrl = `/uploads/resumes/${req.file.filename}`;

    teacher.resumeUrl = fileUrl;
    teacher.resume = teacher.resume || {};
    teacher.resume.pdfUrl = fileUrl;

    await teacher.save();

    return res.json({
      success: true,
      message: "Resume uploaded successfully",
      resumeUrl: teacher.resumeUrl,
      pdfUrl: teacher.resume.pdfUrl
    });
  } catch (err) {
    console.error("Resume upload error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* ======================================
   GET TEACHER BY UID (PROFILE)
   ❗ MUST BE LAST
   GET /api/teacher/:uid
====================================== */
router.get("/:uid", async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ uid: req.params.uid });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found"
      });
    }

    return res.json({ success: true, teacher });
  } catch (err) {
    console.error("Teacher get error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
