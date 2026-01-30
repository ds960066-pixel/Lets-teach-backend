const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");

/* =================================================
   GET MY NOTIFICATIONS
   GET /api/notification/:userUid
================================================= */
router.get("/:userUid", async (req, res) => {
  try {
    const notifications = await Notification.find({
      userUid: req.params.userUid
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      notifications
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* =================================================
   MARK AS READ
   POST /api/notification/read/:id
================================================= */
router.post("/read/:id", async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, {
      isRead: true
    });

    res.json({
      success: true
    });
  } catch {
    res.status(500).json({
      success: false
    });
  }
});

module.exports = router;
