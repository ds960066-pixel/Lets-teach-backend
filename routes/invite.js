const express = require("express");
const router = express.Router();
const Invite = require("../models/Invite");

/* ---------- CREATE INVITE ---------- */
router.post("/create", async (req, res) => {
  try {
    const { fromType, fromUid, toType, toUid } = req.body;

    if (!fromType || !fromUid || !toType || !toUid) {
      return res.status(400).json({
        success: false,
        message: "All fields required",
      });
    }

    const existing = await Invite.findOne({
      fromUid,
      toUid,
      status: "pending",
    });

    if (existing) {
      return res.json({
        success: false,
        message: "Invite already sent",
      });
    }

    const invite = await Invite.create({
      fromType,
      fromUid,
      toType,
      toUid,
    });

    res.json({
      success: true,
      message: "Invite sent successfully",
      invite,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ---------- GET TEACHER PENDING INVITES ---------- */
router.get("/teacher/:uid", async (req, res) => {
  try {
    const invites = await Invite.find({
      teacherUid: req.params.uid,
      status: "pending",
    });

    res.json({ success: true, invites });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ---------- RESPOND INVITE ---------- */
router.post("/respond", async (req, res) => {
  try {
    const { inviteId, status } = req.body;

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const invite = await Invite.findById(inviteId);
    if (!invite) {
      return res.status(404).json({
        success: false,
        message: "Invite not found",
      });
    }

    invite.status = status;
    if (status === "rejected") {
      invite.rejectedAt = new Date();
    }

    await invite.save();

    res.json({
      success: true,
      message: `Invite ${status}`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
