const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const Institute = require("../models/Institute");

const verifyToken = require("../middleware/verifyToken");
const requireRole = require("../middleware/requireRole");

/* ======================================
   GENERATE JWT TOKEN
====================================== */
function generateToken(institute) {
  return jwt.sign(
    {
      uid: institute.uid,
      role: "institute"
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES || "7d"
    }
  );
}

/* ======================================
   REGISTER (EMAIL + PASSWORD)
   POST /api/institute/create
====================================== */
router.post("/create", async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      phone,
      city,
      address,
      subjectsNeeded
    } = req.body;

    if (!email || !password || !name || !phone || !city) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled"
      });
    }

    const existing = await Institute.findOne({
      email: email.toLowerCase()
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Email already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const institute = new Institute({
      uid: "I" + Date.now(), // internal UID
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      phone,
      city,
      address: address || "",
      subjectsNeeded: subjectsNeeded || [],
      verificationStatus: "unverified"
    });

    await institute.save();

    return res.json({
      success: true,
      message: "Institute registered successfully"
    });

  } catch (err) {
    console.error("Institute create error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* ======================================
   LOGIN (EMAIL + PASSWORD)
   POST /api/institute/login
====================================== */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required"
      });
    }

    const institute = await Institute.findOne({
      email: email.toLowerCase()
    });

    if (!institute) {
      return res.status(404).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    if (!institute.password) {
      return res.status(401).json({
        success: false,
        message: "Password not set. Please register again."
      });
    }

    const isMatch = await bcrypt.compare(password, institute.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    if (institute.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Account blocked"
      });
    }

    const token = generateToken(institute);

    return res.json({
      success: true,
      token,
      uid: institute.uid,
      role: "institute"
    });

  } catch (err) {
    console.error("Institute login error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* ======================================
   PUBLIC INSTITUTES
====================================== */
router.get("/public", async (req, res) => {
  try {
    const filter = { isBlocked: false };

    if (req.query.city) filter.city = req.query.city;

    const institutes = await Institute.find(filter).select(
      "uid name city subjectsNeeded"
    );

    return res.json({
      success: true,
      institutes
    });

  } catch (err) {
    console.error("Institute public error:", err);
    return res.status(500).json({
      success: false,
      institutes: []
    });
  }
});

/* ======================================
   GET OWN PROFILE (Protected)
====================================== */
router.get(
  "/profile/:uid",
  verifyToken,
  requireRole("institute"),
  async (req, res) => {
    try {

      if (req.user.uid !== req.params.uid) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized"
        });
      }

      const institute = await Institute.findOne({ uid: req.params.uid });

      if (!institute) {
        return res.status(404).json({
          success: false,
          message: "Institute not found"
        });
      }

      return res.json({
        success: true,
        institute
      });

    } catch (err) {
      console.error("Profile error:", err);
      return res.status(500).json({
        success: false,
        message: "Server error"
      });
    }
  }
);

module.exports = router;