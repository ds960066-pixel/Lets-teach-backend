const express = require("express");
const router = express.Router();

const Teacher = require("../models/Teacher");
const Institute = require("../models/Institute");

/* =================================================
   ADMIN — PENDING VERIFICATION LIST
================================================= */

/* ---------- Pending Teachers ---------- */
router.get("/pending/teachers", async (req, res) => {
  try {
    const teachers = await Teacher.find(
      { verificationStatus: "unverified" },
      {
        _id: 0,
        uid: 1,
        name: 1,
        subject: 1,
        city: 1,
        createdAt: 1
      }
    ).sort({ createdAt: 1 });

    res.json({
      success: true,
      count: teachers.length,
      teachers
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* ---------- Pending Institutes ---------- */
router.get("/pending/institutes", async (req, res) => {
  try {
    const institutes = await Institute.find(
      { verificationStatus: "unverified" },
      {
        _id: 0,
        uid: 1,
        name: 1,
        city: 1,
        createdAt: 1
      }
    ).sort({ createdAt: 1 });

    res.json({
      success: true,
      count: institutes.length,
      institutes
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* =================================================
   ADMIN — VERIFY / REJECT TEACHER
================================================= */

/* ---------- Verify Teacher ---------- */
router.post("/verify/teacher/:uid", async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ uid: req.params.uid });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found"
      });
    }

    teacher.verificationStatus = "verified";
    teacher.verifiedAt = new Date();
    teacher.verificationNote = "Verified by admin";

    await teacher.save();

    res.json({
      success: true,
      message: "Teacher verified successfully"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* ---------- Reject Teacher ---------- */
router.post("/reject/teacher/:uid", async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ uid: req.params.uid });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found"
      });
    }

    teacher.verificationStatus = "rejected";
    teacher.verificationNote =
      req.body.reason || "Rejected by admin";

    await teacher.save();

    res.json({
      success: true,
      message: "Teacher rejected"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* =================================================
   ADMIN — VERIFY / REJECT INSTITUTE
================================================= */

/* ---------- Verify Institute ---------- */
router.post("/verify/institute/:uid", async (req, res) => {
  try {
    const institute = await Institute.findOne({ uid: req.params.uid });

    if (!institute) {
      return res.status(404).json({
        success: false,
        message: "Institute not found"
      });
    }

    institute.verificationStatus = "verified";
    institute.verifiedAt = new Date();
    institute.verificationNote = "Verified by admin";

    await institute.save();

    res.json({
      success: true,
      message: "Institute verified successfully"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* ---------- Reject Institute ---------- */
router.post("/reject/institute/:uid", async (req, res) => {
  try {
    const institute = await Institute.findOne({ uid: req.params.uid });

    if (!institute) {
      return res.status(404).json({
        success: false,
        message: "Institute not found"
      });
    }

    institute.verificationStatus = "rejected";
    institute.verificationNote =
      req.body.reason || "Rejected by admin";

    await institute.save();

    res.json({
      success: true,
      message: "Institute rejected"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

module.exports = router;
