const express = require("express");
const router = express.Router();

const Job = require("../models/job");
const Institute = require("../models/Institute");
const JobApplication = require("../models/JobApplication");

const verifyToken = require("../middleware/verifyToken");
const requireRole = require("../middleware/requireRole");

/* =================================================
   CREATE JOB (Institute Only - JWT Secure)
================================================= */
router.post(
  "/create",
  verifyToken,
  requireRole("institute"),
  async (req, res) => {
    try {
      const instituteUid = req.user.uid; // ✅ JWT se lena hai
      const { title, subject, city, role, salary, description } = req.body;

      if (!title || !subject || !city) {
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

      if (institute.isBlocked) {
        return res.status(403).json({
          success: false,
          message: "Institute blocked"
        });
      }

      const openCount = await Job.countDocuments({
        instituteUid,
        status: "open"
      });

      if (openCount >= 3) {
        return res.status(429).json({
          success: false,
          message: "Max 3 active jobs allowed"
        });
      }

      const job = await Job.create({
        instituteUid,
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
  }
);


/* =================================================
   PUBLIC JOB BROWSING (No Login Required)
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
   INSTITUTE JOBS (JWT Secure)
================================================= */
router.get(
  "/my-jobs",
  verifyToken,
  requireRole("institute"),
  async (req, res) => {
    try {
      const instituteUid = req.user.uid;

      const jobs = await Job.find({ instituteUid })
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
  }
);


/* =================================================
   CLOSE JOB (JWT Secure)
================================================= */
router.post(
  "/close/:jobId",
  verifyToken,
  requireRole("institute"),
  async (req, res) => {
    try {
      const job = await Job.findById(req.params.jobId);

      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Job not found"
        });
      }

      // ✅ Only owner institute can close
      if (job.instituteUid !== req.user.uid) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized"
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
  }
);

module.exports = router;
