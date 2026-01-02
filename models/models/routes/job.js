const express = require("express");
const router = express.Router();
const Job = require("../models/Job");

/**
 * CREATE JOB (Institute)
 * POST /api/job/create
 */
router.post("/create", async (req, res) => {
  try {
    const {
      instituteUid,
      instituteName,
      subject,
      city,
      role,
      experienceRequired,
    } = req.body;

    if (!instituteUid || !subject || !city) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    const job = new Job({
      instituteUid,
      instituteName,
      subject,
      city,
      role,
      experienceRequired,
    });

    await job.save();

    res.json({
      success: true,
      job,
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

/**
 * PUBLIC BROWSE JOBS
 * GET /api/job/browse?city=Delhi&subject=Math
 */
router.get("/browse", async (req, res) => {
  try {
    const filter = {};
    if (req.query.city) filter.city = req.query.city;
    if (req.query.subject) filter.subject = req.query.subject;

    const jobs = await Job.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      jobs,
    });
  } catch {
    res.status(500).json({ success: false });
  }
});

module.exports = router;
