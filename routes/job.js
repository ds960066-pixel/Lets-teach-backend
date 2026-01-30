const express = require("express");
const router = express.Router();

const Job = require("../models/Job");
const Institute = require("../models/Institute");

/* =================================================
   CREATE JOB (OTP VERIFIED INSTITUTE)
   POST /api/job/create
================================================= */
router.post("/create", async (req, res) => {
  try {
    const { instituteUid, title, subject, city, role, salary, description } = req.body;

    if (!instituteUid || !title || !subject || !city) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing"
      });
    }

    const uid = String(instituteUid).trim();
    const institute = await Institute.findOne({ uid });

    if (!institute) {
      return res.status(404).json({
        success: false,
        message: "Institute not found"
      });
    }

    if (institute.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Institute blocked"
      });
    }

    if (!institute.phoneVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify phone (OTP) to post jobs"
      });
    }

    // anti-spam: max 3 open jobs
    const openCount = await Job.countDocuments({ instituteUid: uid, status: "open" });
    if (openCount >= 3) {
      return res.status(429).json({
        success: false,
        message: "Limit reached: Max 3 active jobs allowed"
      });
    }

    const safeRole =
      role === "part-time" || role === "full-time" || role === "both"
        ? role
        : "both";

    const job = await Job.create({
      instituteUid: uid,
      title: String(title).trim(),
      subject: String(subject).trim(),
      city: String(city).trim(),
      role: safeRole,
      salary: salary ? String(salary).trim() : "Negotiable",
      description: description ? String(description).trim() : "",
      status: "open",
      postedAt: new Date()
    });

    return res.json({
      success: true,
      message: "Job posted successfully",
      job
    });
  } catch (err) {
    console.error("Job create error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* =================================================
   PUBLIC BROWSE JOBS (ONLY OPEN)
   GET /api/job/browse?city=&subject=&role=
================================================= */
router.get("/browse", async (req, res) => {
  try {
    const filter = { status: "open" };

    // case-insensitive exact match
    if (req.query.city) filter.city = new RegExp(`^${String(req.query.city).trim()}$`, "i");
    if (req.query.subject) filter.subject = new RegExp(`^${String(req.query.subject).trim()}$`, "i");

    if (req.query.role === "part-time") filter.role = { $in: ["part-time", "both"] };
    if (req.query.role === "full-time") filter.role = { $in: ["full-time", "both"] };

    const jobs = await Job.find(filter)
      .sort({ postedAt: -1, createdAt: -1 })
      .limit(50);

    return res.json({
      success: true,
      jobs
    });
  } catch (err) {
    console.error("Job browse error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* =================================================
   INSTITUTE JOBS (DASHBOARD)
   GET /api/job/institute/:uid
================================================= */
router.get("/institute/:uid", async (req, res) => {
  try {
    const uid = String(req.params.uid).trim();

    const jobs = await Job.find({ instituteUid: uid })
      .sort({ postedAt: -1, createdAt: -1 });

    return res.json({
      success: true,
      jobs
    });
  } catch (err) {
    console.error("Institute jobs error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* =================================================
   CLOSE JOB
   POST /api/job/close/:jobId
================================================= */
router.post("/close/:jobId", async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }

    job.status = "closed";
    await job.save();

    return res.json({
      success: true,
      message: "Job closed"
    });
  } catch (err) {
    console.error("Job close error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

module.exports = router;
