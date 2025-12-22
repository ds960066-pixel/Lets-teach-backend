const express = require("express");
const router = express.Router();
const Invite = require("../models/Invite");

/* ---------- CREATE INVITE ---------- */
router.post("/create", async (req, res) => {
  try {
    const { instituteUid, teacherUid } = req.body;

    if (!instituteUid || !teacherUid) {
      return res.status(400).json({
        success: false,
        message: "Institute UID and Teacher UID required",
      });
    }

    const existing = await Invite.findOne({
      instituteUid,
      teacherUid,
      status: "pending",
    });

    if (existing) {
      return res.json({
        success: false,
        message: "Invite already sent",
      });
    }

    const invite = await Invite.create({
      instituteUid,
      teacherUid,
      status: "pending",
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

/* ---------- GET INVITES FOR TEACHER ---------- */
router.get("/teacher/:uid", async (req, res) => {
  try {
    const invites = await Invite.find({
      teacherUid: req.params.uid,
    });

    res.json({
      success: true,
      invites,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ---------- RESPOND INVITE ---------- */
router.post("/respond", async (req, res) => {
  try {
    const { inviteId, status } = req.body;

    if (!inviteId || !status) {
      return res.status(400).json({
        success: false,
        message: "Invite ID and status required",
      });
    }

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
    await invite.save();

    res.json({
      success: true,
      message: `Invite ${status}`,
      invite,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;

