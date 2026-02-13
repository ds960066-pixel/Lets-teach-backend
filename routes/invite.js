const express = require("express");
const router = express.Router();

const Invite = require("../models/Invite");
const Teacher = require("../models/Teacher");
const Institute = require("../models/Institute");
const { requireRole } = require("../middleware/auth");

/*
=================================================
CREATE INVITE (Teacher ↔ Institute)
POST /api/invite/create
=================================================
*/
router.post("/create", async (req, res) => {
  try {
    const { fromType, fromUid, toType, toUid } = req.body;

    if (!fromType || !fromUid || !toType || !toUid) {
      return res.status(400).json({
        success: false,
        message: "Missing fields"
      });
    }

    if (fromUid === toUid) {
      return res.status(400).json({
        success: false,
        message: "Invalid invite"
      });
    }

    // 🔒 Only teacher ↔ institute allowed
    const validCombo =
      (fromType === "teacher" && toType === "institute") ||
      (fromType === "institute" && toType === "teacher");

    if (!validCombo) {
      return res.status(403).json({
        success: false,
        message: "Invalid invite type"
      });
    }

    // 🔍 Verify sender exists
    if (fromType === "teacher") {
      const teacher = await Teacher.findOne({
        uid: fromUid,
        isBlocked: false
      });
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: "Teacher not found"
        });
      }
    }

    if (fromType === "institute") {
      const institute = await Institute.findOne({
        uid: fromUid,
        isBlocked: false
      });
      if (!institute) {
        return res.status(404).json({
          success: false,
          message: "Institute not found"
        });
      }
    }

    // 🔍 Verify receiver exists
    if (toType === "teacher") {
      const teacher = await Teacher.findOne({
        uid: toUid,
        isBlocked: false
      });
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: "Teacher not found"
        });
      }
    }

    if (toType === "institute") {
      const institute = await Institute.findOne({
        uid: toUid,
        isBlocked: false
      });
      if (!institute) {
        return res.status(404).json({
          success: false,
          message: "Institute not found"
        });
      }
    }

    // 🔁 Prevent duplicate pending invite (both directions)
    const existing = await Invite.findOne({
      $or: [
        { fromUid, toUid, status: "pending" },
        { fromUid: toUid, toUid: fromUid, status: "pending" }
      ]
    });

    if (existing) {
      return res.json({
        success: false,
        message: "Invite already pending"
      });
    }

    const invite = await Invite.create({
      fromType,
      fromUid,
      toType,
      toUid,
      status: "pending",
      createdAt: new Date()
    });

    return res.json({
      success: true,
      message: "Invite sent successfully",
      invite
    });

  } catch (err) {
    console.error("Invite create error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});


/*
=================================================
GET INVITES FOR USER
GET /api/invite/user/:uid
=================================================
*/
router.get("/user/:uid", async (req, res) => {
  try {
    const uid = req.params.uid;

    const invites = await Invite.find({
      $or: [{ fromUid: uid }, { toUid: uid }]
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      invites
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});


/*
=================================================
ACCEPT INVITE
POST /api/invite/accept/:id
=================================================
*/
router.post("/accept/:id", async (req, res) => {
  try {
    const invite = await Invite.findById(req.params.id);

    if (!invite) {
      return res.status(404).json({
        success: false,
        message: "Invite not found"
      });
    }

    invite.status = "accepted";
    invite.acceptedAt = new Date();
    await invite.save();

    return res.json({
      success: true,
      message: "Invite accepted"
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});


/*
=================================================
REJECT INVITE
POST /api/invite/reject/:id
=================================================
*/
router.post("/reject/:id", async (req, res) => {
  try {
    const invite = await Invite.findById(req.params.id);

    if (!invite) {
      return res.status(404).json({
        success: false,
        message: "Invite not found"
      });
    }

    invite.status = "rejected";
    invite.rejectedAt = new Date();
    await invite.save();

    return res.json({
      success: true,
      message: "Invite rejected"
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

module.exports = router;
