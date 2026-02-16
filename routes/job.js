const express = require("express");
const router = express.Router();

const Job = require("../models/job");
const Institute = require("../models/Institute");
const JobApplication = require("../models/JobApplication");
const { requireRole } = require("../middleware/auth");

/* =================================================
   CREATE JOB (Institute Only)
================================================= */
router.post("/create", requireRole("institute"), async (req, res) => {
  try {
    const { instituteUid, title, subject, city, role, salary, description } = req.body;

    if (!instituteUid || !title || !subject || !city) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing"
      });
    }

    const cleanUid = String(instituteUid).trim();

    const institute = await Institute.findOne({ uid: cleanUid });

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
      instituteUid: cleanUid,
      status: "open"
    });

    if (openCount >= 3) {
      return res.status(429).json({
        success: false,
        message: "Max 3 active jobs allowed"
      });
    }

    const job = await Job.create({
      instituteUid: cleanUid,
      title: title.trim(),
      subject: subject.trim(),
      city: city.trim(),
      role: role || "both",
      salary: salary || "Negotiable",
      description: description || "",
      status: "open",
      postedAt: new Date()
    });

    return res.json({
      success: true,
      message: "Job posted successfully",
      job
    });

  } catch (err) {
    console.error("Create job error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});


/* =================================================
   PUBLIC JOB BROWSING
================================================= */
router.get("/browse", async (req, res) => {
  try {
    const filter = { status: "open" };

    if (req.query.city) {
      filter.city = new RegExp(`^${req.query.city.trim()}$`, "i");
    }

    if (req.query.subject) {
      filter.subject = new RegExp(`^${req.query.subject.trim()}$`, "i");
    }

    if (req.query.role === "part-time") {
      filter.role = { $in: ["part-time", "both"] };
    }

    if (req.query.role === "full-time") {
      filter.role = { $in: ["full-time", "both"] };
    }

    const jobs = await Job.find(filter)
      .sort({ postedAt: -1 })
      .limit(50);

    return res.json({
      success: true,
      jobs
    });

  } catch (err) {
    console.error("Browse jobs error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});


/* =================================================
   INSTITUTE JOBS (SECURE)
================================================= */
router.get("/institute/:uid", requireRole("institute"), async (req, res) => {
  try {
    const paramUid = String(req.params.uid).trim();
    const headerUid = String(req.headers["x-uid"] || "").trim();

    // 🔐 Security: UID mismatch block
    if (paramUid !== headerUid) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access"
      });
    }

    const jobs = await Job.find({ instituteUid: paramUid })
      .sort({ postedAt: -1 });

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
================================================= */
router.post("/close/:jobId", requireRole("institute"), async (req, res) => {
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
    console.error("Close job error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

module.exports = router;
