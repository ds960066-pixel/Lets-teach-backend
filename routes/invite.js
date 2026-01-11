const express = require("express");
const router = express.Router();

const Invite = require("../models/Invite");
const Teacher = require("../models/Teacher");
const Institute = require("../models/Institute");

/* CREATE INVITE */
router.post("/create", async (req, res) => {
  try {
    const { fromType, fromUid, toType, toUid } = req.body;

    if (!fromType || !fromUid || !toType || !toUid) {
      return res.status(400).json({ success: false });
    }

    if (fromType !== "institute" || toType !== "teacher") {
      return res.status(403).json({ success: false });
    }

    const institute = await Institute.findOne({
      uid: fromUid,
      registered: true,
      verificationStatus: "verified",
      isBlocked: false
    });

    if (!institute) {
      return res.status(403).json({ success: false });
    }

    const teacher = await Teacher.findOne({
      uid: toUid,
      verificationStatus: "verified",
      isBlocked: false
    });

    if (!teacher) {
      return res.status(404).json({ success: false });
    }

    const existing = await Invite.findOne({
      fromType,
      fromUid,
      toType,
      toUid,
      status: "pending"
    });

    if (existing) {
      return res.json({ success: false, message: "Invite already sent" });
    }

    const invite = await Invite.create({
      fromType,
      fromUid,
      toType,
      toUid,
      status: "pending"
    });

    res.json({ success: true, invite });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

/* TEACHER INVITES */
router.get("/teacher/:uid", async (req, res) => {
  try {
    const invites = await Invite.find({ toUid: req.params.uid });
    res.json({ success: true, invites });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

/* INSTITUTE INVITES */
router.get("/institute/:uid", async (req, res) => {
  try {
    const invites = await Invite.find({ fromUid: req.params.uid });
    res.json({ success: true, invites });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

/* ACCEPT */
router.post("/accept/:id", async (req, res) => {
  await Invite.findByIdAndUpdate(req.params.id, {
    status: "accepted",
    acceptedAt: new Date()
  });
  res.json({ success: true });
});

/* REJECT */
router.post("/reject/:id", async (req, res) => {
  await Invite.findByIdAndUpdate(req.params.id, {
    status: "rejected",
    rejectedAt: new Date()
  });
  res.json({ success: true });
});

module.exports = router;
