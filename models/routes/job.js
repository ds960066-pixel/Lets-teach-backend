const express = require("express");
const router = express.Router();
const Job = require("../models/Job");

/**
 * CREATE JOB (Institute)
 * POST /api/job/create
 */
router.post("/create", async (req, res) => {
  try {
    const { instituteUid, title, subject, city, experience, role, description } = req.body;

    if (!instituteUid || !title || !subject || !city) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing"
      });
    }

    const job = await Job.create({
      instituteUid,
      title,
      subject,
      city,
      experience,
      role,
      description
    });

    res.json({ success: true, job });
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
    const q = {};
    if (req.query.city) q.city = req.query.city;
    if (req.query.subject) q.subject = req.query.subject;

    const jobs = await Job.find(q).sort({ createdAt: -1 });
    res.json({ success: true, jobs });
  } catch {
    res.status(500).json({ success: false });
  }
});

module.exports = router;
