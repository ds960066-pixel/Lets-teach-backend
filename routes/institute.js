const express = require("express");
const router = express.Router();
const Institute = require("../models/Institute");

/* ======================================
   LOGIN CHECK (INSTITUTE) ✅ FIRST
   GET /api/institute/login-check/:uid
====================================== */
router.get("/login-check/:uid", async (req, res) => {
  try {
    const institute = await Institute.findOne({ uid: req.params.uid });

    if (!institute) {
      return res.json({ status: "REGISTER_REQUIRED" });
    }

    if (institute.isBlocked) {
      return res.json({ status: "BLOCKED" });
    }

    return res.json({ status: "OK" });
  } catch (err) {
    console.error("Institute login-check error:", err);
    return res.status(500).json({ status: "ERROR" });
  }
});

/* ======================================
   CREATE INSTITUTE
   POST /api/institute/create
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

    res.json({
      success: true,
      message: "Institute registered successfully",
      institute
    });
  } catch (err) {
    console.error("Institute create error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* ======================================
   PUBLIC – VERIFIED INSTITUTES ONLY
   GET /api/institute/public
====================================== */
router.get("/public", async (req, res) => {
  try {
    const filter = {
      isBlocked: false
    };

    if (req.query.city) filter.city = req.query.city;

    const institutes = await Institute.find(filter).select(
      "uid name city subjectsNeeded"
    );

    res.json({
      success: true,
      institutes
    });
  } catch (err) {
    console.error("Institute public error:", err);
    res.status(500).json({
      success: false,
      institutes: []
    });
  }
});

/* ======================================
   BROWSE AFTER LOGIN (MIXED VIEW)
   GET /api/institute/browse
====================================== */
router.get("/browse", async (req, res) => {
  try {
    const filter = {
      isBlocked: false
    };

    if (req.query.city) filter.city = req.query.city;

    const institutes = await Institute.find(filter).select(
      "uid name city subjectsNeeded verificationStatus"
    );

    res.json({
      success: true,
      institutes
    });
  } catch (err) {
    console.error("Institute browse error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* ======================================
   GET INSTITUTE BY UID (PROFILE)
   ❗ MUST BE LAST
   GET /api/institute/:uid
====================================== */
router.get("/:uid", async (req, res) => {
  try {
    const institute = await Institute.findOne({ uid: req.params.uid });

    if (!institute) {
      return res.status(404).json({
        success: false,
        message: "Institute not found"
      });
    }

    res.json({
      success: true,
      institute
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

module.exports = router;
