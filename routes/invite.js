const express = require("express");
const router = express.Router();
const Invite = require("../models/Invite");

/**
 * CREATE INVITE
 */
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
      fromType,
      fromUid,
      toType,
      toUid,
      status: "pending",
    });

    if (existing) {
      return res.json({
        success: false,
        message: "Invite already sent",
      });
    }

    const invite = new Invite({
      fromType,
      fromUid,
      toType,
      toUid,
    });

    await invite.save();

    res.json({
      success: true,
      message: "Invite sent successfully",
      invite,
    });
  } catch (err) {
    console.error("INVITE ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/**
 * GET INVITES (FOR USER)
 */
router.get("/teacher/:uid", async (req, res) => {
  try {
    const invites = await Invite.find({
      toUid: req.params.uid,
      status: "pending"
    });

    res.json({
      success: true,
      invites
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


/**
 * ACCEPT INVITE
 */
router.post("/accept/:id", async (req, res) => {
  await Invite.findByIdAndUpdate(req.params.id, {
    status: "accepted",
  });
  res.json({ success: true });
});

/**
 * REJECT INVITE
 */
router.post("/reject/:id", async (req, res) => {
  await Invite.findByIdAndUpdate(req.params.id, {
    status: "rejected",
    rejectedAt: new Date(),
  });
  res.json({ success: true });
});
/**
 * GET ACCEPTED CONNECTIONS FOR TEACHER
 */
router.get("/accepted/teacher/:uid", async (req, res) => {
  try {
    const connections = await Invite.find({
      toUid: req.params.uid,
      status: "accepted",
    });

    res.json({
      success: true,
      connections,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;
