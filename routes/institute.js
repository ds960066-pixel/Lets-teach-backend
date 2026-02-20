const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
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
   LOGIN (INSTITUTE) ✅ JWT
   POST /api/institute/login
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

    const institute = await Institute.findOne({ uid });

    if (!institute) {
      return res.status(404).json({
        success: false,
        message: "Institute not found"
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
      token
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
   CREATE INSTITUTE (REGISTER)
====================================== */
router.post("/create", async (req, res) => {
  try {
    const { uid, name, phone, city, address, subjectsNeeded } = req.body;

    if (!uid || !name || !phone || !city) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing"
      });
    }

    const existing = await Institute.findOne({ uid });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Institute already exists"
      });
    }

    const institute = new Institute({
      uid,
      name,
      phone,
      city,
      address,
      subjectsNeeded
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
   PUBLIC – VERIFIED INSTITUTES ONLY
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
   BROWSE AFTER LOGIN (Protected)
====================================== */
router.get(
  "/browse",
  verifyToken,
  requireRole("institute"),
  async (req, res) => {
    try {

      const filter = { isBlocked: false };

      if (req.query.city) filter.city = req.query.city;

      const institutes = await Institute.find(filter).select(
        "uid name city subjectsNeeded verificationStatus"
      );

      return res.json({
        success: true,
        institutes
      });

    } catch (err) {
      console.error("Institute browse error:", err);
      return res.status(500).json({
        success: false,
        message: "Server error"
      });
    }
  }
);


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
      return res.status(500).json({
        success: false,
        message: "Server error"
      });
    }
  }
);

module.exports = router;
