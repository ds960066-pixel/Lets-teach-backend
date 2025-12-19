const express = require("express");
const router = express.Router();
const Teacher = require("../models/Teacher"); // path check

// CREATE TEACHER
router.post("/create", async (req, res) => {
  try {
    const teacher = await Teacher.create(req.body);
    res.json({ success: true, teacher });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET TEACHER BY UID
router.get("/:uid", async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ uid: req.params.uid });
    if (!teacher) {
      return res.json({ success: false, message: "Teacher not found" });
    }
    res.json({ success: true, teacher });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

