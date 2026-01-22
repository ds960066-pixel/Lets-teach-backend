const express = require("express");
const router = express.Router();

const Institute = require("../models/Institute");

// ✅ Firebase Admin (add this file next step)
// const admin = require("../firebaseAdmin");

/* ======================================
   LOGIN CHECK (INSTITUTE)
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

    // ✅ extra info for frontend
    return res.json({
      status: "OK",
      phoneVerified: !!institute.phoneVerified,
      verificationStatus: institute.verificationStatus || "unverified"
    });
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

    const existing = await Institute.findOne({ uid: String(uid).trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Institute already exists"
      });
    }

    const institute = new Institute({
      uid: String(uid).trim(),
      name: String(name).trim(),
      phone: String(phone).trim(),
      city: String(city).trim(),
      address: address ? String(address).trim() : "",
      subjectsNeeded: Array.isArray(subjectsNeeded) ? subjectsNeeded : []
      // phoneVerified default false रहेगा
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
   VERIFY PHONE (OTP) ✅ NEW
   POST /api/institute/verify-phone
   body: { uid, idToken }
====================================== */
router.post("/verify-phone", async (req, res) => {
  try {
    const { uid, idToken } = req.body;

    if (!uid || !idToken) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing"
      });
    }

    const institute = await Institute.findOne({ uid: String(uid).trim() });

    if (!institute) {
      return res.status(404).json({
        success: false,
        message: "Institute not found"
      });
    }

    if (institute.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Institute blocked"
      });
    }

    // ✅ Firebase token verify (enable after firebaseAdmin.js added)
    // const decoded = await admin.auth().verifyIdToken(idToken);
    // const phone = decoded.phone_number || "";
    // if (!phone) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Phone not found in token"
    //   });
    // }

    // ✅ TEMP (until Firebase admin wired): allow marking verified if you trust frontend
    // ⚠️ NOTE: Once firebaseAdmin is ready, remove temp line and use decoded phone.
    const phone = institute.phoneE164 || institute.phone || "";

    institute.phoneVerified = true;
    institute.phoneE164 = phone;
    await institute.save();

    return res.json({
      success: true,
      message: "Phone verified successfully",
      phone
    });
  } catch (err) {
    console.error("Institute verify-phone error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* ======================================
   PUBLIC – INSTITUTES (PUBLIC VIEW)
   GET /api/institute/public
====================================== */
router.get("/public", async (req, res) => {
  try {
    const filter = { isBlocked: false };
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
    const filter = { isBlocked: false };
    if (req.query.city) filter.city = req.query.city;

    const institutes = await Institute.find(filter).select(
      "uid name city subjectsNeeded verificationStatus phoneVerified"
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
