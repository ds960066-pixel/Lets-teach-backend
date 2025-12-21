const express = require("express");
const router = express.Router();

const Invite = require("../models/Invite");
const Block = require("../models/Block");

/* ---------- CREATE INVITE ---------- */
router.post("/create", async (req, res) => {
  try {
    const { fromType, fromUid, toType, toUid } = req.body;

    if (!fromType || !fromUid || !toType || !toUid) {
      return res.json({
        success: false,
        message: "All fields are required",
      });
    }

    // 1️⃣ Check if blocked
    const blocked = await Block.findOne({
      blockerUid: toUid,
      blockedUid: fromUid,
    });

    if (blocked) {
      return res.json({
        success: false,
        message: "You are blocked by this user",
      });
    }

    // 2️⃣ Check duplicate pending invite
    const existingInvite = await Invite.findOne({
      fromUid,
      toUid,
      status: "pending",
    });

    if (existingInvite) {
      return res.json({
        success: false,
        message: "Invite already sent",
      });
    }

    // 3️⃣ Cooldown after reject (7 days)
    const rejectedInvite = await Invite.findOne({
      fromUid,
      toUid,
      status: "rejected",
    });

    if (
      rejectedInvite &&
      rejectedInvite.rejectedAt &&
      Date.now() - rejectedInvite.rejectedAt.getTime() <
        7 * 24 * 60 * 60 * 1000
    ) {
      return res.json({
        success: false,
        message: "You can invite again after 7 days",
      });
    }

    // 4️⃣ Create invite
    const invite = await Invite.create({
      fromType,
      fromUid,
      toType,
      toUid,
      status: "pending",
    });

    res.json({
      success: true,
      message: "Invite sent successfully",
      invite,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ---------- GET INVITES FOR USER ---------- */
router.get("/:uid", async (req, res) => {
  try {
    const invites = await Invite.find({ toUid: req.params.uid }).sort({
      createdAt: -1,
    });

    res.json({ success: true, invites });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ---------- ACCEPT INVITE ---------- */
router.post("/accept", async (req, res) => {
  try {
    const { inviteId } = req.body;

    if (!inviteId) {
      return res.json({
        success: false,
        message: "inviteId required",
      });
    }

    await Invite.findByIdAndUpdate(inviteId, {
      status: "accepted",
    });

    res.json({ success: true, message: "Invite accepted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ---------- REJECT INVITE ---------- */
router.post("/reject", async (req, res) => {
  try {
    const { inviteId } = req.body;

    if (!inviteId) {
      return res.json({
        success: false,
        message: "inviteId required",
      });
    }

    await Invite.findByIdAndUpdate(inviteId, {
      status: "rejected",
      rejectedAt: new Date(),
    });

    res.json({ success: true, message: "Invite rejected" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ---------- BLOCK USER ---------- */
router.post("/block", async (req, res) => {
  try {
    const { blockerType, blockerUid, blockedType, blockedUid } = req.body;

    if (!blockerUid || !blockedUid) {
      return res.json({
        success: false,
        message: "blockerUid and blockedUid required",
      });
    }

    await Block.create({
      blockerType,
      blockerUid,
      blockedType,
      blockedUid,
    });

    res.json({ success: true, message: "User blocked successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
