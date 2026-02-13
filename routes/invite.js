const express = require("express");
const router = express.Router();

const Invite = require("../models/Invite");
const Teacher = require("../models/Teacher");
const Institute = require("../models/Institute");

/* =================================================
   CREATE INVITE (Teacher OR Institute)
   POST /api/invite/create
================================================= */
router.post("/create", async (req, res) => {
  try {
    const { fromType, fromUid, toType, toUid } = req.body;

    if (!fromType || !fromUid || !toType || !toUid) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // ❌ Same role invite not allowed
    if (fromType === toType) {
      return res.status(403).json({
        success: false,
        message: "Invalid invite type"
      });
    }

    // ✅ Validate sender
    if (fromType === "teacher") {
      const teacher = await Teacher.findOne({
        uid: fromUid,
        isBlocked: false
      });
      if (!teacher) {
        return res.status(403).json({
          success: false,
          message: "Invalid teacher"
        });
      }
    }

    if (fromType === "institute") {
      const institute = await Institute.findOne({
        uid: fromUid,
        isBlocked: false
      });
      if (!institute) {
        return res.status(403).json({
          success: false,
          message: "Invalid institute"
        });
      }
    }

    // ✅ Validate receiver
    if (toType === "teacher") {
      const teacher = await Teacher.findOne({
        uid: toUid,
        isBlocked: false
      });
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: "Teacher not found"
        });
      }
    }

    if (toType === "institute") {
      const institute = await Institute.findOne({
        uid: toUid,
        isBlocked: false
      });
      if (!institute) {
        return res.status(404).json({
          success: false,
          message: "Institute not found"
        });
      }
    }

    // ❌ Prevent duplicate pending invites
    const existing = await Invite.findOne({
      fromUid,
      toUid,
      status: "pending"
    });

    if (existing) {
      return res.json({
        success: false,
        message: "Invite already sent"
      });
    }

    const invite = await Invite.create({
      fromType,
      fromUid,
      toType,
      toUid,
      status: "pending"
    });

    return res.json({
      success: true,
      message: "Invite sent successfully",
      invite
    });

  } catch (err) {
    console.error("Create invite error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});


/* =================================================
   GET ALL INVITES FOR USER
   GET /api/invite/user/:uid
================================================= */
router.get("/user/:uid", async (req, res) => {
  try {
    const uid = req.params.uid;

    const invites = await Invite.find({
      $or: [{ fromUid: uid }, { toUid: uid }]
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      invites
    });

  } catch (err) {
    console.error("Get invites error:", err);
    return res.status(500).json({
      success: false
    });
  }
});


/* =================================================
   ACCEPT INVITE
   POST /api/invite/accept/:id
================================================= */
router.post("/accept/:id", async (req, res) => {
  try {
    const invite = await Invite.findById(req.params.id);
    if (!invite) {
      return res.status(404).json({
        success: false,
        message: "Invite not found"
      });
    }

    invite.status = "accepted";
    invite.acceptedAt = new Date();
    await invite.save();

    return res.json({
      success: true,
      message: "Invite accepted"
    });

  } catch (err) {
    console.error("Accept invite error:", err);
    return res.status(500).json({
      success: false
    });
  }
});


/* =================================================
   REJECT INVITE
   POST /api/invite/reject/:id
================================================= */
router.post("/reject/:id", async (req, res) => {
  try {
    const invite = await Invite.findById(req.params.id);
    if (!invite) {
      return res.status(404).json({
        success: false,
        message: "Invite not found"
      });
    }

    invite.status = "rejected";
    invite.rejectedAt = new Date();
    await invite.save();

    return res.json({
      success: true,
      message: "Invite rejected"
    });

  } catch (err) {
    console.error("Reject invite error:", err);
    return res.status(500).json({
      success: false
    });
  }
});

module.exports = router;
