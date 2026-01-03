const express = require("express");
const router = express.Router();

const Job = require("../models/Job");
const Teacher = require("../models/Teacher");
const Institute = require("../models/Institute");
const JobApplication = require("../models/JobApplication");
const Notification = require("../models/Notification");


/* =================================================
   APPLY TO JOB (TEACHER)
   POST /api/job/apply
================================================= */
router.post("/apply", async (req, res) => {
  try {
    const { jobId, teacherUid } = req.body;

    if (!jobId || !teacherUid) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing"
      });
    }

    const job = await Job.findById(jobId);
    if (!job || job.status !== "open") {
      return res.status(404).json({
        success: false,
        message: "Job not available"
      });
    }

    const teacher = await Teacher.findOne({ uid: teacherUid });
    if (
      !teacher ||
      teacher.verificationStatus !== "verified" ||
      teacher.isBlocked
    ) {
      return res.status(403).json({
        success: false,
        message: "Teacher not allowed to apply"
      });
    }

    const alreadyApplied = await JobApplication.findOne({
      jobId,
      teacherUid
    });

    if (alreadyApplied) {
      return res.status(409).json({
        success: false,
        message: "Already applied to this job"
      });
    }

    const application = new JobApplication({
      jobId,
      teacherUid,
      instituteUid: job.instituteUid
    });

    await application.save();

    /* =========================
       🔔 NOTIFICATION (FINAL)
    ========================= */
    await Notification.create({
      userUid: job.instituteUid,
      userType: "institute",
      title: "New Job Application",
      message: `A teacher has applied for your job: ${job.title}`
    });

    /* ========================= */

    res.json({
      success: true,
      message: "Job application submitted",
      application
    });
  } catch (err) {
    console.error("Job apply error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* =================================================
   INSTITUTE → VIEW APPLICATIONS
   GET /api/job/applications/institute/:uid
================================================= */
router.get("/applications/institute/:uid", async (req, res) => {
  try {
    const applications = await JobApplication.find({
      instituteUid: req.params.uid
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      applications
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* =================================================
   TEACHER → MY APPLICATIONS
   GET /api/job/applications/teacher/:uid
================================================= */
router.get("/applications/teacher/:uid", async (req, res) => {
  try {
    const applications = await JobApplication.find({
      teacherUid: req.params.uid
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      applications
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* =================================================
   INSTITUTE → SHORTLIST APPLICANT
   POST /api/job/application/shortlist/:applicationId
================================================= */
router.post("/application/shortlist/:applicationId", async (req, res) => {
  try {
    const application = await JobApplication.findById(req.params.applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    application.status = "shortlisted";
    await application.save();

    /* =========================
       🔔 NOTIFICATION (TEACHER)
    ========================= */
    await Notification.create({
      userUid: application.teacherUid,
      userType: "teacher",
      title: "Application Shortlisted 🎉",
      message: "Congratulations! Your job application has been shortlisted."
    });
    /* ========================= */

    res.json({
      success: true,
      message: "Applicant shortlisted"
    });
  } catch (err) {
    console.error("Shortlist error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});


/* =================================================
   INSTITUTE → REJECT APPLICANT
   POST /api/job/application/reject/:applicationId
================================================= */
router.post("/application/reject/:applicationId", async (req, res) => {
  try {
    const application = await JobApplication.findById(req.params.applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    application.status = "rejected";
    await application.save();

    /* =========================
       🔔 NOTIFICATION (TEACHER)
    ========================= */
    await Notification.create({
      userUid: application.teacherUid,
      userType: "teacher",
      title: "Application Update",
      message: "Your job application was not selected this time."
    });
    /* ========================= */

    res.json({
      success: true,
      message: "Applicant rejected"
    });
  } catch (err) {
    console.error("Reject error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

module.exports = router;
