const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const Invite = require("../models/Invite");

/* ---------- SEND MESSAGE (ONLY AFTER ACCEPT) ---------- */
router.post("/send", async (req, res) => {
  try {
    const { senderUid, receiverUid, text } = req.body;

    if (!senderUid || !receiverUid || !text) {
      return res.status(400).json({
        success: false,
        message: "All fields required",
      });
    }

    const invite = await Invite.findOne({
      $or: [
        {
          instituteUid: senderUid,
          teacherUid: receiverUid,
          status: "accepted",
        },
        {
          instituteUid: receiverUid,
          teacherUid: senderUid,
          status: "accepted",
        },
      ],
    });

    if (!invite) {
      return res.status(403).json({
        success: false,
        message: "Chat allowed only after invite accepted",
      });
    }

    const message = new Message({
      senderUid,
      receiverUid,
      text,
    });

    await message.save();

    res.json({
      success: true,
      message: "Message sent",
      data: message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/* ---------- GET CHAT ---------- */
router.get("/:uid1/:uid2", async (req, res) => {
  try {
    const { uid1, uid2 } = req.params;

    const messages = await Message.find({
      $or: [
        { senderUid: uid1, receiverUid: uid2 },
        { senderUid: uid2, receiverUid: uid1 },
      ],
    }).sort({ createdAt: 1 });

    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;
