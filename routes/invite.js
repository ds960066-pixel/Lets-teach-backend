const express = require("express");
const router = express.Router();

const Invite = require("../models/Invite");
const Teacher = require("../models/Teacher");
const Institute = require("../models/Institute");

/* =================================================
   CREATE INVITE (INSTITUTE → TEACHER ONLY)
   POST /api/invite/create
================================================= */
router.post("/create", async (req, res) => {
  try {
    const { fromType, fromUid, toType, toUid } = req.body;

    /* -------- BASIC VALIDATION -------- */
    if (!fromType || !fromUid || !toType || !toUid) {
      return res.status(400).json({
        success: false,
        message: "All fields required"
      });
    }

    /* -------- DIRECTION LOCK -------- */
    if (fromType !== "institute" || toType !== "teacher") {
      return res.status(403).json({
        success: false,
        message: "Invalid invite direction"
      });
    }

    /* -------- INSTITUTE CHECK -------- */
    const institute = await Institute.findOne({
      uid: fromUid,
      registered: true,
      verificationStatus: "verified",
      isBlocked: false
    });

    if (!institute) {
      return res.status(403).json({
        success: false,
        message: "Institute not allowed to send invite"
      });
    }

    /* -------- TEACHER CHECK -------- */
    const teacher = await Teacher.findOne({
      uid: toUid,
      verificationStatus: "verified",
      isBlocked: false
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not available"
      });
    }

    /* -------- DUPLICATE CHECK -------- */
    const existing = await Invite.findOne({
      fromType,
      fromUid,
      toType,
      toUid,
      status: "pending"
    });

    if (existing) {
      return res.json({
        success: false,
        message: "Invite already sent"
      });
    }

    /* -------- CREATE INVITE -------- */
    const invite = await Invite.create({
      fromType,
      fromUid,
      toType,
      toUid,
      status: "pending"
    });

    res.json({
      success: true,
      message: "Invite sent successfully",
      invite
    });
  } catch (err) {
    console.error("INVITE ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* =================================================
   GET INVITES FOR TEACHER
   GET /api/invite/teacher/:uid
================================================= */
router.get("/teacher/:uid", async (req, res) => {
  try {
    const invites = await Invite.find({
      toUid: req.params.uid
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      invites
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* =================================================
   GET INVITES FOR INSTITUTE
   GET /api/invite/institute/:uid
================================================= */
router.get("/institute/:uid", async (req, res) => {
  try {
    const invites = await Invite.find({
      fromUid: req.params.uid
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      invites
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* =================================================
   ACCEPT INVITE
   POST /api/invite/accept/:id
================================================= */
router.post("/accept/:id", async (req, res) => {
  await Invite.findByIdAndUpdate(req.params.id, {
    status: "accepted",
    acceptedAt: new Date()
  });

  res.json({ success: true });
});

/* =================================================
   REJECT INVITE
   POST /api/invite/reject/:id
================================================= */
router.post("/reject/:id", async (req, res) => {
  await Invite.findByIdAndUpdate(req.params.id, {
    status: "rejected",
    rejectedAt: new Date()
  });

  res.json({ success: true });
});

module.exports = router;
