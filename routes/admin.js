const express = require("express");
const router = express.Router();

const Teacher = require("../models/Teacher");
const Institute = require("../models/Institute");
const ManualInstitute = require("../models/ManualInstitute");

/* =================================================
   ADMIN — PENDING VERIFICATION LIST
================================================= */

/* ---------- Pending Teachers ---------- */
router.get("/pending/teachers", async (req, res) => {
  try {
    const teachers = await Teacher.find(
      { verificationStatus: "unverified" },
      {
        _id: 0,
        uid: 1,
        name: 1,
        subject: 1,
        city: 1,
        createdAt: 1
      }
    ).sort({ createdAt: 1 });

    res.json({
      success: true,
      count: teachers.length,
      teachers
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ---------- Pending Institutes ---------- */
router.get("/pending/institutes", async (req, res) => {
  try {
    const institutes = await Institute.find(
      { verificationStatus: "unverified" },
      {
        _id: 0,
        uid: 1,
        name: 1,
        city: 1,
        createdAt: 1
      }
    ).sort({ createdAt: 1 });

    res.json({
      success: true,
      count: institutes.length,
      institutes
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* =================================================
   ADMIN — VERIFY / REJECT TEACHER
================================================= */

router.post("/verify/teacher/:uid", async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ uid: req.params.uid });
    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    teacher.verificationStatus = "verified";
    teacher.verifiedAt = new Date();
    teacher.verificationNote = "Verified by admin";

    await teacher.save();

    res.json({ success: true, message: "Teacher verified successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/reject/teacher/:uid", async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ uid: req.params.uid });
    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    teacher.verificationStatus = "rejected";
    teacher.verificationNote = req.body.reason || "Rejected by admin";

    await teacher.save();

    res.json({ success: true, message: "Teacher rejected" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* =================================================
   ADMIN — VERIFY / REJECT INSTITUTE
================================================= */

router.post("/verify/institute/:uid", async (req, res) => {
  try {
    const institute = await Institute.findOne({ uid: req.params.uid });
    if (!institute) {
      return res.status(404).json({ success: false, message: "Institute not found" });
    }

    institute.verificationStatus = "verified";
    institute.registered = true; // IMPORTANT
    institute.verifiedAt = new Date();
    institute.verificationNote = "Verified by admin";

    await institute.save();

    res.json({ success: true, message: "Institute verified successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/reject/institute/:uid", async (req, res) => {
  try {
    const institute = await Institute.findOne({ uid: req.params.uid });
    if (!institute) {
      return res.status(404).json({ success: false, message: "Institute not found" });
    }

    institute.verificationStatus = "rejected";
    institute.verificationNote = req.body.reason || "Rejected by admin";

    await institute.save();

    res.json({ success: true, message: "Institute rejected" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* =================================================
   ADMIN — MANUAL INSTITUTE DIRECTORY
================================================= */

/* ---------- Add Manual Institute ---------- */
router.post("/manual-institute", async (req, res) => {
  try {
    const { name, city, phone, email } = req.body;

    if (!name || !city) {
      return res.status(400).json({
        success: false,
        message: "Name and city are required"
      });
    }

    const inst = await ManualInstitute.create({
      name,
      city,
      phone,
      email
    });

    res.json({ success: true, institute: inst });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ---------- List Manual Institutes ---------- */
router.get("/manual-institutes", async (req, res) => {
  try {
    const list = await ManualInstitute.find().sort({ createdAt: -1 });
    res.json({ success: true, institutes: list });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ---------- Link Manual → Registered Institute ---------- */
router.post("/link-manual-institute", async (req, res) => {
  try {
    const { manualId, uid } = req.body;

    const institute = await Institute.findOne({
      uid,
      registered: true
    });

    if (!institute) {
      return res.status(404).json({
        success: false,
        message: "Registered institute not found"
      });
    }

    const updated = await ManualInstitute.findByIdAndUpdate(
      manualId,
      {
        isRegistered: true,
        linkedInstituteUid: uid
      },
      { new: true }
    );

    res.json({ success: true, institute: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});
/* =================================================
   ADMIN — ALL LIST (SEARCH)
================================================= */

/* ---------- All Teachers (optional filters) ---------- */
router.get("/all/teachers", async (req, res) => {
  try {
    const q = {};
    if (req.query.city) q.city = req.query.city;
    if (req.query.subject) q.subject = req.query.subject;
    if (req.query.uid) q.uid = req.query.uid;

    const teachers = await Teacher.find(q)
      .select("uid name phone subject city verificationStatus isBlocked createdAt")
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({ success: true, teachers });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ---------- All Institutes (optional filters) ---------- */
router.get("/all/institutes", async (req, res) => {
  try {
    const q = {};
    if (req.query.city) q.city = req.query.city;
    if (req.query.uid) q.uid = req.query.uid;

    const institutes = await Institute.find(q)
      .select("uid name phone city verificationStatus registered isBlocked createdAt")
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({ success: true, institutes });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* =================================================
   ADMIN — BLOCK / UNBLOCK
================================================= */
router.post("/block/teacher/:uid", async (req, res) => {
  try {
    const t = await Teacher.findOne({ uid: req.params.uid });
    if (!t) return res.status(404).json({ success: false, message: "Teacher not found" });
    t.isBlocked = true;
    await t.save();
    res.json({ success: true, message: "Teacher blocked" });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/unblock/teacher/:uid", async (req, res) => {
  try {
    const t = await Teacher.findOne({ uid: req.params.uid });
    if (!t) return res.status(404).json({ success: false, message: "Teacher not found" });
    t.isBlocked = false;
    await t.save();
    res.json({ success: true, message: "Teacher unblocked" });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/block/institute/:uid", async (req, res) => {
  try {
    const i = await Institute.findOne({ uid: req.params.uid });
    if (!i) return res.status(404).json({ success: false, message: "Institute not found" });
    i.isBlocked = true;
    await i.save();
    res.json({ success: true, message: "Institute blocked" });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/unblock/institute/:uid", async (req, res) => {
  try {
    const i = await Institute.findOne({ uid: req.params.uid });
    if (!i) return res.status(404).json({ success: false, message: "Institute not found" });
    i.isBlocked = false;
    await i.save();
    res.json({ success: true, message: "Institute unblocked" });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* =================================================
   ADMIN — DELETE
================================================= */
router.delete("/delete/teacher/:uid", async (req, res) => {
  try {
    const result = await Teacher.deleteOne({ uid: req.params.uid });
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.delete("/delete/institute/:uid", async (req, res) => {
  try {
    const result = await Institute.deleteOne({ uid: req.params.uid });
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
});


module.exports = router;
