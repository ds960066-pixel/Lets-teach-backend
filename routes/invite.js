const express = require("express");
const router = express.Router();
const Invite = require("../models/Invite");

/**
 * CREATE INVITE
 */
router.post("/create", async (req, res) => {
  try {
    const { instituteUid, teacherUid } = req.body;

    if (!instituteUid || !teacherUid) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }

    const existing = await Invite.findOne({
      instituteUid,
      teacherUid,
      status: "pending",
    });

    if (existing) {
      return res.json({ success: false, message: "Invite already sent" });
    }

    const invite = new Invite({ instituteUid, teacherUid });
    await invite.save();

    res.json({ success: true, message: "Invite sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * GET INVITES FOR TEACHER
 */
router.get("/teacher/:teacherUid", async (req, res) => {
  try {
    const invites = await Invite.find({
      teacherUid: req.params.teacherUid,
      status: "pending",
    });

    res.json({ success: true, invites });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

/**
 * ACCEPT INVITE
 */
router.post("/accept/:id", async (req, res) => {
  try {
    await Invite.findByIdAndUpdate(req.params.id, { status: "accepted" });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

/**
 * REJECT INVITE
 */
router.post("/reject/:id", async (req, res) => {
  try {
    await Invite.findByIdAndUpdate(req.params.id, { status: "rejected" });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

module.exports = router;
