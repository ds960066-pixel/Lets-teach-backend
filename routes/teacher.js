const express = require("express");
const router = express.Router();
const Teacher = require("../models/Teacher");

/* ======================================
   LOGIN CHECK (TEACHER) ✅ FIRST
   GET /api/teacher/login-check/:uid
====================================== */
router.get("/login-check/:uid", async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ uid: req.params.uid });

    if (!teacher) return res.json({ status: "REGISTER_REQUIRED" });
    if (teacher.isBlocked) return res.json({ status: "BLOCKED" });

    return res.json({ status: "OK" });
  } catch (err) {
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

    res.json({ success: true, teacher });
  } catch {
    res.status(500).json({ success: false });
  }
});
/* ======================================
   SAVE / UPDATE RESUME
   POST /api/teacher/resume
====================================== */
router.post("/resume", async (req, res) => {
  try {
    const { uid, summary, experienceDetails, education, skills } = req.body;

    if (!uid || !summary || !education) {
      return res.status(400).json({
        success: false,
        message: "Required resume fields missing"
      });
    }

    const teacher = await Teacher.findOne({ uid });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found"
      });
    }

    teacher.resume = {
      summary,
      experienceDetails,
      education,
      skills: skills || [],
      isComplete: true
    };

    await teacher.save();

    res.json({
      success: true,
      message: "Resume saved successfully"
    });
  } catch (err) {
    console.error("Resume save error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
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
      "uid name subject city experience role"
    );

    res.json({ success: true, teachers });
  } catch {
    res.status(500).json({ success: false });
  }
});

/* ======================================
   BROWSE AFTER LOGIN (MIX)
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

    res.json({ success: true, teachers });
  } catch {
    res.status(500).json({ success: false });
  }
});

/* ======================================
   SAVE / UPDATE TEACHER RESUME ⭐⭐⭐
   POST /api/teacher/resume/:uid
====================================== */
router.post("/resume/:uid", async (req, res) => {
  try {
    const { about, skills, education } = req.body;

    const teacher = await Teacher.findOne({ uid: req.params.uid });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found"
      });
    }

    teacher.about = about || teacher.about;
    teacher.skills = Array.isArray(skills) ? skills : teacher.skills;
    teacher.education = education || teacher.education;

    await teacher.save();

    res.json({
      success: true,
      message: "Resume saved successfully",
      resume: {
        about: teacher.about,
        skills: teacher.skills,
        education: teacher.education
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});
/* ======================================
   UPDATE TEACHER RESUME
   POST /api/teacher/resume
====================================== */
router.post("/resume", async (req, res) => {
  try {
    const { uid, about, skills, education } = req.body;

    if (!uid) {
      return res.status(400).json({
        success: false,
        message: "UID required"
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
      : (skills || "").split(",").map(s => s.trim());

    await teacher.save();

    res.json({
      success: true,
      message: "Resume updated successfully"
    });
  } catch (err) {
    console.error("Resume update error:", err);
    res.status(500).json({
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

    res.json({ success: true, teacher });
  } catch {
    res.status(500).json({ success: false });
  }
});

module.exports = router;
