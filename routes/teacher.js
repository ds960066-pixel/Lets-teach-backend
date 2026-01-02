const express = require("express");
const router = express.Router();
const Teacher = require("../models/Teacher");

/**
 * CREATE TEACHER
 * POST /api/teacher/create
 */
router.post("/create", async (req, res) => {
  try {
    const { uid, name, phone, subject, city, experience } = req.body;

    if (!uid || !name || !phone || !subject || !city) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled",
      });
    }

    const existingTeacher = await Teacher.findOne({ uid });
    if (existingTeacher) {
      return res.status(409).json({
        success: false,
        message: "Teacher already registered",
      });
    }

    const teacher = new Teacher({
      uid,
      name,
      phone,
      subject,
      city,
      experience,
    });

    await teacher.save();

    res.json({
      success: true,
      message: "Teacher registered successfully",
      teacher,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * PUBLIC BROWSE TEACHERS
 * GET /api/teacher/browse?city=Delhi&subject=Math
 */
router.get("/browse", async (req, res) => {
  try {
    const filter = {};
    if (req.query.city) filter.city = req.query.city;
    if (req.query.subject) filter.subject = req.query.subject;

    const teachers = await Teacher.find(filter).select(
      "uid name subject city experience"
    );

    res.json({ success: true, teachers });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * SEARCH TEACHERS
 * GET /api/teacher/search?city=Delhi
 */
router.get("/search", async (req, res) => {
  try {
    const { city, subject } = req.query;

    const q = {};
    if (city) q.city = city;
    if (subject) q.subject = subject;

    const teachers = await Teacher.find(q).limit(50);
    res.json({ success: true, teachers });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

/**
 * GET TEACHER BY UID
 * GET /api/teacher/:uid
 */
router.get("/:uid", async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ uid: req.params.uid });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    res.json({ success: true, teacher });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
