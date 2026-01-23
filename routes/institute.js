const express = require("express");
const router = express.Router();

const Institute = require("../models/Institute");
const admin = require("../firebaseAdmin"); // ✅ optional (may be null if not installed)

/* ======================================
   LOGIN CHECK (INSTITUTE)
   GET /api/institute/login-check/:uid
====================================== */
router.get("/login-check/:uid", async (req, res) => {
  try {
    const institute = await Institute.findOne({ uid: req.params.uid });

    if (!institute) return res.json({ status: "REGISTER_REQUIRED" });
    if (institute.isBlocked) return res.json({ status: "BLOCKED" });

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

    const cleanUid = String(uid).trim();

    const existing = await Institute.findOne({ uid: cleanUid });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Institute already exists"
      });
    }

    const institute = new Institute({
      uid: cleanUid,
      name: String(name).trim(),
      phone: String(phone).trim(),
      city: String(city).trim(),
      address: address ? String(address).trim() : "",
      subjectsNeeded: Array.isArray(subjectsNeeded) ? subjectsNeeded : []
      // phoneVerified default false
    });

    await institute.save();

    return res.json({
      success: true,
      message: "Institute registered successfully",
      institute
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
   VERIFY PHONE (OTP) ✅ REAL (but safe)
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

    // ✅ If firebase-admin not available on server, don't crash deploy
    if (!admin || !admin.apps || !admin.apps.length) {
      return res.status(503).json({
        success: false,
        message:
          "OTP service unavailable right now. Please try again later (server setup pending)."
      });
    }

    // ✅ Verify Firebase ID token
    const decoded = await admin.auth().verifyIdToken(idToken);
    const phone = decoded.phone_number || "";

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone not found in token"
      });
    }

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
    if (req.query.city) filter.city = String(req.query.city).trim();

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
   BROWSE AFTER LOGIN (MIXED VIEW)
   GET /api/institute/browse
====================================== */
router.get("/browse", async (req, res) => {
  try {
    const filter = { isBlocked: false };
    if (req.query.city) filter.city = String(req.query.city).trim();

    const institutes = await Institute.find(filter).select(
      "uid name city subjectsNeeded verificationStatus phoneVerified"
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
});

module.exports = router;
