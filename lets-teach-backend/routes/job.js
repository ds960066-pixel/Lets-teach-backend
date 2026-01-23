const express = require("express");
const router = express.Router();
const Job = require("../models/Job");

/**
 * TEST ROUTE (VERY IMPORTANT)
 */
router.get("/test", (req, res) => {
  res.send("Job route working");
});

/**
 * BROWSE JOBS (PUBLIC)
 * GET /api/job/browse?city=Delhi&subject=Math
 */
router.get("/browse", async (req, res) => {
  try {
    const filter = {};
    if (req.query.city) filter.city = req.query.city;
    if (req.query.subject) filter.subject = req.query.subject;

    const jobs = await Job.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, jobs });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

/**
 * CREATE JOB
 * POST /api/job/create
 */
router.post("/create", async (req, res) => {
  try {
    const { instituteUid, title, subject, city, role, salary } = req.body;

    if (!instituteUid || !title || !subject || !city) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    const job = new Job({
      instituteUid,
      title,
      subject,
      city,
      role,
      salary,
    });

    await job.save();

    res.json({
      success: true,
      message: "Job posted successfully",
      job,
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

module.exports = router;
