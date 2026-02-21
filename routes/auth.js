const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const Teacher = require("../models/Teacher");
const Institute = require("../models/Institute");

/* ===============================
   GENERATE JWT TOKEN
================================= */
function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES || "7d"
    }
  );
}

/* ===============================
   REGISTER
   POST /api/auth/register
================================= */
router.post("/register", async (req, res) => {
  try {
    const { role, name, email, password } = req.body;

    if (!role || !name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    if (!["teacher", "institute"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role"
      });
    }

    const Model = role === "teacher" ? Teacher : Institute;

    const existing = await Model.findOne({ email });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Email already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await Model.create({
      name,
      email,
      password: hashedPassword,
      role
    });

    return res.json({
      success: true,
      message: "Registered successfully"
    });

  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* ===============================
   LOGIN
   POST /api/auth/login
================================= */
router.post("/login", async (req, res) => {
  try {
    const { role, email, password } = req.body;

    if (!role || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields required"
      });
    }

    const Model = role === "teacher" ? Teacher : Institute;

    const user = await Model.findOne({ email });

    if (!user || !user.password) {
      return res.status(404).json({
        success: false,
        message: "Account not found"
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Account blocked"
      });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      token,
      role: user.role
    });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

module.exports = router;