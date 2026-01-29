const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const Invite = require("../models/Invite");

/**
 * SEND MESSAGE (only if invite accepted)
 */
router.post("/send", async (req, res) => {
  try {
    const { senderUid, receiverUid, text } = req.body;

    if (!senderUid || !receiverUid || !text) {
      return res.status(400).json({
        success: false,
        message: "All fields required",
      });
    }

    // 🔐 check accepted invite exists
    const invite = await Invite.findOne({
      $or: [
        { fromUid: senderUid, toUid: receiverUid, status: "accepted" },
        { fromUid: receiverUid, toUid: senderUid, status: "accepted" },
      ],
    });

    if (!invite) {
      return res.status(403).json({
        success: false,
        message: "Chat allowed only after invite acceptance",
      });
    }

    const message = await Message.create({
      senderUid,
      receiverUid,
      text,
    });

    res.json({
      success: true,
      message: "Message sent",
      data: message,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * GET CHAT
 */
router.get("/:uid1/:uid2", async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { senderUid: req.params.uid1, receiverUid: req.params.uid2 },
        { senderUid: req.params.uid2, receiverUid: req.params.uid1 },
      ],
    }).sort({ createdAt: 1 });

    res.json({ success: true, messages });
  } catch {
    res.status(500).json({ success: false });
  }
});

module.exports = router;
