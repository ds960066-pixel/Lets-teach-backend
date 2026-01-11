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

    if (!teacher) {
      return res.json({ status: "REGISTER_REQUIRED" });
    }

    if (teacher.isBlocked) {
      return res.json({ status: "BLOCKED" });
    }

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
   PUBLIC BROWSE (NO LOGIN)
   ✅ ONLY VERIFIED TEACHERS
   GET /api/teacher/public
====================================== */
router.get("/public", async (req, res) => {
  try {
    const filter = {
      isBlocked: false
    };

    if (req.query.city) filter.city = req.query.city;
    if (req.query.subject) filter.subject = req.query.subject;

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
   BROWSE AFTER LOGIN
   ✅ VERIFIED + UNVERIFIED (MIX)
   GET /api/teacher/browse
====================================== */
router.get("/browse", async (req, res) => {
  try {
    const filter = {
      isBlocked: false
    };

    if (req.query.city) filter.city = req.query.city;
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.role) filter.role = req.query.role;

    const teachers = await Teacher.find(filter).select(
      "uid name subject city experience role verificationStatus"
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
