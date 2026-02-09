const express = require("express");
const router = express.Router();

const Job = require("../models/job");
const Institute = require("../models/Institute");
const Teacher = require("../models/Teacher");
const JobApplication = require("../models/JobApplication");

/* ===============================
   CREATE JOB
=============================== */
router.post("/create", async (req, res) => {
  try {
    const { instituteUid, title, subject, city, role, salary, description } = req.body;

    if (!instituteUid || !title || !subject || !city) {
      return res.status(400).json({ success: false, message: "Required fields missing" });
    }

    const institute = await Institute.findOne({ uid: instituteUid });
    if (!institute) {
      return res.status(404).json({ success: false, message: "Institute not found" });
    }

    const job = await Job.create({
      instituteUid,
      title,
      subject,
      city,
      role: role || "both",
      salary: salary || "Negotiable",
      description: description || "",
      status: "open",
      postedAt: new Date()
    });

    res.json({ success: true, job });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ===============================
   BROWSE JOBS
=============================== */
router.get("/browse", async (req, res) => {
  try {
    const jobs = await Job.find({ status: "open" }).limit(50);
    res.json({ success: true, jobs });
  } catch {
    res.status(500).json({ success: false });
  }
});

/* ===============================
   APPLY JOB
=============================== */
router.post("/apply", async (req, res) => {
  try {
    const { jobId, uid } = req.body;

    const teacher = await Teacher.findOne({ uid });
    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    const already = await JobApplication.findOne({ jobId, teacherUid: uid });
    if (already) {
      return res.status(409).json({ success: false, message: "Already applied" });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    await JobApplication.create({
      jobId,
      teacherUid: uid,
      instituteUid: job.instituteUid,
      resumeSnapshot: {
        about: teacher.resumeText || "",
        skills: teacher.skills || [],
        education: teacher.education || ""
      },
      status: "applied"
    });

    res.json({ success: true, message: "Job applied successfully" });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ===============================
   INSTITUTE JOBS
=============================== */
router.get("/institute/:uid", async (req, res) => {
  try {
    const jobs = await Job.find({ instituteUid: req.params.uid });
    res.json({ success: true, jobs });
  } catch {
    res.status(500).json({ success: false });
  }
});

/* ===============================
   CLOSE JOB
=============================== */
router.post("/close/:jobId", async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    job.status = "closed";
    await job.save();

    res.json({ success: true, message: "Job closed" });
  } catch {
    res.status(500).json({ success: false });
  }
});

module.exports = router;
