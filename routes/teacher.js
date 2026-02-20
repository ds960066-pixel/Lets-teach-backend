const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Teacher = require("../models/Teacher");
const upload = require("../utils/uploadResume");

const verifyToken = require("../middleware/verifyToken");
const requireRole = require("../middleware/requireRole");

/* ======================================
   GENERATE JWT TOKEN
====================================== */
function generateToken(user) {
  return jwt.sign(
    {
      uid: user.uid,   // using your custom uid field
      role: "teacher"
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES || "7d"
    }
  );
}

/* ======================================
   LOGIN (TEACHER)
====================================== */
router.post("/login", async (req, res) => {
  try {
    const { uid } = req.body;

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

    if (teacher.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Account blocked"
      });
    }

    const token = generateToken(teacher);

    return res.json({
      success: true,
      token
    });

  } catch (err) {
    console.error("Teacher login error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});


/* ======================================
   CREATE TEACHER (REGISTER)
====================================== */
router.post("/create", async (req, res) => {
  try {
    const { uid, name, phone, subject, city, experience } = req.body;

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
      verificationStatus: "unverified"
    });

    await teacher.save();

    return res.json({ success: true });

  } catch (err) {
    console.error("Teacher create error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});


/* ======================================
   SAVE / UPDATE RESUME (Protected)
====================================== */
router.post(
  "/resume/:uid",
  verifyToken,
  requireRole("teacher"),
  async (req, res) => {
    try {

      if (req.user.uid !== req.params.uid) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized"
        });
      }

      const { about, education, skills } = req.body;

      if (!about || !education || !skills) {
        return res.status(400).json({
          success: false,
          message: "All resume fields required"
        });
      }

      const teacher = await Teacher.findOne({ uid: req.params.uid });
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
   UPLOAD RESUME PDF (Protected)
====================================== */
router.post(
  "/upload-resume/:uid",
  verifyToken,
  requireRole("teacher"),
  upload.single("resume"),
  async (req, res) => {
    try {

      if (req.user.uid !== req.params.uid) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized"
        });
      }

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
   GET TEACHER PROFILE (Protected)
====================================== */
router.get(
  "/:uid",
  verifyToken,
  requireRole("teacher"),
  async (req, res) => {
    try {

      if (req.user.uid !== req.params.uid) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized"
        });
      }

      const teacher = await Teacher.findOne({ uid: req.params.uid });

      if (!teacher) {
        return res.status(404).json({
          success: false
        });
      }

      return res.json({
        success: true,
        teacher
      });

    } catch (err) {
      console.error("Get teacher error:", err);
      return res.status(500).json({
        success: false
      });
    }
  }
);

module.exports = router;
