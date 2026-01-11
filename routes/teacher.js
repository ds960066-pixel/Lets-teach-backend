const express = require("express");
const router = express.Router();
const Teacher = require("../models/Teacher");

/* ======================================
   LOGIN CHECK (TEACHER) ✅ REQUIRED
   GET /api/teacher/login-check/:uid
====================================== */
router.get("/login-check/:uid", async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ uid: req.params.uid });

    if (!teacher) {
      return res.json({ status: "REGISTER_REQUIRED" });
    }

    if (teacher.isBlocked) {
      return res.json({ status: "BLOCKED" });
    }

    return res.json({ status: "OK" });
  } catch (err) {
    console.error("Teacher login-check error:", err);
    res.status(500).json({ status: "ERROR" });
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

/* ======================================
   PUBLIC BROWSE (ONLY VERIFIED)
   GET /api/teacher/browse
====================================== */
router.get("/browse", async (req, res) => {
  try {
    const filter = {
      verificationStatus: "verified",
      isBlocked: false
    };

    if (req.query.city) filter.city = req.query.city;
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.role) filter.role = req.query.role;

    const teachers = await Teacher.find(filter).select(
      "uid name subject city experience role"
    );

    res.json({
      success: true,
      teachers
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* ======================================
   SEARCH (ONLY VERIFIED)
   GET /api/teacher/search
====================================== */
router.get("/search", async (req, res) => {
  try {
    const { city, subject, role } = req.query;

    const q = {
      verificationStatus: "verified",
      isBlocked: false
    };

    if (city) q.city = city;
    if (subject) q.subject = subject;
    if (role) q.role = role;

    const teachers = await Teacher.find(q)
      .select("uid name subject city experience role")
      .limit(50);

    res.json({
      success: true,
      teachers
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* ======================================
   GET TEACHER BY UID (PRIVATE / DASHBOARD)
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

    res.json({
      success: true,
      teacher
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

module.exports = router;
