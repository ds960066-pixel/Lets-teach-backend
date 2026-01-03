const express = require("express");
const router = express.Router();

const Teacher = require("../models/Teacher");
const Institute = require("../models/Institute");

/* =========================
   VERIFY TEACHER
========================= */
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

/* =========================
   REJECT TEACHER
========================= */
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
    teacher.verificationNote = req.body.reason || "Rejected by admin";

    await teacher.save();

    res.json({
      success: true,
      message: "Teacher rejected"
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* =========================
   VERIFY INSTITUTE
========================= */
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
  } catch {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* =========================
   REJECT INSTITUTE
========================= */
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
    institute.verificationNote = req.body.reason || "Rejected by admin";

    await institute.save();

    res.json({
      success: true,
      message: "Institute rejected"
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

module.exports = router;
