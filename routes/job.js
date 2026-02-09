const express = require("express");
const router = express.Router();

const Job = require("../models/job");
const Institute = require("../models/Institute");
const Teacher = require("../models/Teacher");
const JobApplication = require("../models/JobApplication");

/* =================================================
   CREATE JOB
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

    const openCount = await Job.countDocuments({
      instituteUid: uid,
      status: "open"
    });

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
   PUBLIC BROWSE JOBS
   GET /api/job/browse
================================================= */
router.get("/browse", async (req, res) => {
  try {
    const filter = { status: "open" };

    if (req.query.city)
      filter.city = new RegExp(`^${String(req.query.city).trim()}$`, "i");

    if (req.query.subject)
      filter.subject = new RegExp(`^${String(req.query.subject).trim()}$`, "i");

    if (req.query.role === "part-time")
      filter.role = { $in: ["part-time", "both"] };

    if (req.query.role === "full-time")
      filter.role = { $in: ["full-time", "both"] };

    const jobs = await Job.find(filter)
      .sort({ postedAt: -1, createdAt: -1 })
      .limit(50);

    return res.json({ success: true, jobs });
  } catch (err) {
    console.error("Job browse error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});


================================================= */
/* =================================================
   APPLY JOB (FINAL – GUARANTEED SAVE)
   POST /api/job/apply
================================================= */
router.post("/apply", async (req, res) => {
  try {
    const { jobId, uid } = req.body;

    if (!jobId || !uid) {
      return res.status(400).json({
        success: false,
        message: "Missing jobId or uid"
      });
    }

    // 1️⃣ Teacher fetch
    const teacher = await Teacher.findOne({ uid });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found"
      });
    }

    // 2️⃣ Job fetch
    const job = await Job.findById(jobId);
    if (!job || job.status !== "open") {
      return res.status(404).json({
        success: false,
        message: "Job not available"
      });
    }

    // 3️⃣ Duplicate apply block
    const alreadyApplied = await JobApplication.findOne({
      jobId,
      teacherUid: uid
    });

    if (alreadyApplied) {
      return res.status(409).json({
        success: false,
        message: "Already applied"
      });
    }

    // 4️⃣ Resume snapshot (SAFE – no field dependency)
    const resumeSnapshot = {
      about: teacher.resumeText || "",
      skills: Array.isArray(teacher.skills) ? teacher.skills : [],
      education: teacher.education || ""
    };

    // 5️⃣ SAVE APPLICATION (THIS WAS THE BLOCKER)
    await JobApplication.create({
      jobId,
      teacherUid: uid,
      instituteUid: job.instituteUid,
      resumeSnapshot,
      status: "applied"
    });

    return res.json({
      success: true,
      message: "Job applied successfully"
    });

  } catch (err) {
    console.error("Job apply error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* =================================================
   INSTITUTE JOBS
   GET /api/job/institute/:uid
================================================= */
router.get("/institute/:uid", async (req, res) => {
  try {
    const uid = String(req.params.uid).trim();

    const jobs = await Job.find({ instituteUid: uid })
      .sort({ postedAt: -1, createdAt: -1 });

    return res.json({ success: true, jobs });
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
