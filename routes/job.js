const express = require("express");
const router = express.Router();

const Job = require("../models/Job");
const Institute = require("../models/Institute");

/* =================================================
   CREATE JOB (ONLY VERIFIED INSTITUTE)
   POST /api/job/create
================================================= */
router.post("/create", async (req, res) => {
  try {
    const {
      instituteUid,
      title,
      subject,
      city,
      role,
      salary,
      description
    } = req.body;

    if (!instituteUid || !title || !subject || !city) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing"
      });
    }

    const institute = await Institute.findOne({ uid: instituteUid });

    if (!institute) {
      return res.status(404).json({
        success: false,
        message: "Institute not found"
      });
    }

    if (institute.isBlocked || institute.verificationStatus !== "verified") {
      return res.status(403).json({
        success: false,
        message: "Institute not verified to post jobs"
      });
    }

    const job = await Job.create({
      instituteUid,
      title: String(title).trim(),
      subject: String(subject).trim(),
      city: String(city).trim(),
      role: role ? String(role).trim() : "both",
      salary: salary ? String(salary).trim() : "Negotiable",
      description: description ? String(description).trim() : "",
      status: "open"
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

    if (req.query.city) filter.city = req.query.city;
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.role) filter.role = req.query.role;

    const jobs = await Job.find(filter)
      .sort({ createdAt: -1 })
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
    const jobs = await Job.find({ instituteUid: req.params.uid })
      .sort({ createdAt: -1 });

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
