const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const Invite = require("../models/Invite");

/* =====================================================
   SEND MESSAGE (Only if invite is ACCEPTED)
   POST /api/chat/send
===================================================== */
router.post("/send", async (req, res) => {
  try {
    const { senderUid, receiverUid, text } = req.body;

    if (!senderUid || !receiverUid || !text) {
      return res.status(400).json({
        success: false,
        message: "senderUid, receiverUid and text are required",
      });
    }

    // 🔐 Allow chat only if invite is accepted (either direction)
    const invite = await Invite.findOne({
      $or: [
        { fromUid: senderUid, toUid: receiverUid, status: "accepted" },
        { fromUid: receiverUid, toUid: senderUid, status: "accepted" },
      ],
    }).lean();

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
      data: message,
    });
  } catch (err) {
    console.error("SEND MESSAGE ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/* =====================================================
   GET CHAT HISTORY
   GET /api/chat/:uid1/:uid2
===================================================== */
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
  } catch (err) {
    console.error("GET CHAT ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/* =====================================================
   CHAT LIST WITH LAST MESSAGE (Dashboard)
   GET /api/chat/list/:uid
===================================================== */
router.get("/list/:uid", async (req, res) => {
  try {
    const uid = req.params.uid;

    const messages = await Message.find({
      $or: [{ senderUid: uid }, { receiverUid: uid }],
    }).sort({ createdAt: -1 });

    const chatMap = {};

    messages.forEach((m) => {
      const other =
        m.senderUid === uid ? m.receiverUid : m.senderUid;

      if (!chatMap[other]) {
        chatMap[other] = {
          with: other,
          lastText: m.text,
          time: m.createdAt,
        };
      }
    });

    res.json({
      success: true,
      chats: Object.values(chatMap),
    });
  } catch (err) {
    console.error("CHAT LIST ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;
