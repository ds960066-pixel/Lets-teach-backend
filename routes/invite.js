const express = require("express");
const router = express.Router();

const Invite = require("../models/Invite");
const Block = require("../models/Block");

/* ---------- CREATE INVITE ---------- */
router.post("/create", async (req, res) => {
  try {
    const { fromType, fromUid, toType, toUid } = req.body;

    // 1️⃣ Block check
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

    // 2️⃣ Duplicate pending invite
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

    // 3️⃣ Cooldown after reject (7 days)
    const rejectedInvite = await Invite.findOne({
      fromUid,
      toUid,
      status: "rejected",
    });

    if (
      rejectedInvite &&
      Date.now() - rejectedInvite.rejectedAt < 7 * 24 * 60 * 60 * 1000
    ) {
      return res.json({
        success: false,
        message: "You can invite again after 7 days",
      });
    }

    // 4️⃣ Create invite
    await Invite.create({
      fromType,
      fromUid,
      toType,
      toUid,
    });

    res.json({ success: true, message: "Invite sent successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ---------- ACCEPT INVITE ---------- */
router.post("/accept", async (req, res) => {
  const { inviteId } = req.body;
  await Invite.findByIdAndUpdate(inviteId, { status: "accepted" });
  res.json({ success: true, message: "Invite accepted" });
});

/* ---------- REJECT INVITE ---------- */
router.post("/reject", async (req, res) => {
  const { inviteId } = req.body;
  await Invite.findByIdAndUpdate(inviteId, {
    status: "rejected",
    rejectedAt: new Date(),
  });
  res.json({ success: true, message: "Invite rejected" });
});

/* ---------- BLOCK USER ---------- */
router.post("/block", async (req, res) => {
  const { blockerType, blockerUid, blockedType, blockedUid } = req.body;

  await Block.create({
    blockerType,
    blockerUid,
    blockedType,
    blockedUid,
  });

  res.json({ success: true, message: "User blocked successfully" });
});

module.exports = router;
