const express = require("express");
const router = express.Router();

const Message = require("../models/Message");
const Invite = require("../models/Invite");

/**
 * SEND MESSAGE
 */
router.post("/send", async (req, res) => {
  try {
    const { senderUid, receiverUid, text } = req.body;

    if (!senderUid || !receiverUid || !text) {
      return res.status(400).json({ success: false });
    }

    // ✅ Check accepted invite
    const acceptedInvite = await Invite.findOne({
      $or: [
        { fromUid: senderUid, toUid: receiverUid },
        { fromUid: receiverUid, toUid: senderUid },
      ],
      status: "accepted",
    });

    if (!acceptedInvite) {
      return res.status(403).json({
        success: false,
        message: "Chat not allowed",
      });
    }

    const message = await Message.create({
      senderUid,
      receiverUid,
      text,
    });

    res.json({ success: true, message });
  } catch {
    res.status(500).json({ success: false });
  }
});

/**
 * GET CHAT
 */
router.get("/:uid1/:uid2", async (req, res) => {
  const { uid1, uid2 } = req.params;

  const messages = await Message.find({
    $or: [
      { senderUid: uid1, receiverUid: uid2 },
      { senderUid: uid2, receiverUid: uid1 },
    ],
  }).sort({ createdAt: 1 });

  res.json({ success: true, messages });
});

module.exports = router;
