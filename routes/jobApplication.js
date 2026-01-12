console.log("🔥 jobApplication routes loaded");
const express = require("express");
const router = express.Router();

const Job = require("../models/Job");
const Teacher = require("../models/Teacher");
const Institute = require("../models/Institute");
const Invite = require("../models/Invite");
const JobApplication = require("../models/JobApplication");
const Notification = require("../models/Notification");

/* =================================================
   APPLY TO JOB (TEACHER) ✅ RESUME SNAPSHOT ADDED
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

if (!teacher || teacher.isBlocked) {
  return res.status(403).json({
    success: false,
    message: "Teacher not allowed to apply"
  });
}

/* 🔒 RESUME MANDATORY CHECK */
if (
  !teacher.about ||
  !teacher.education ||
  !teacher.skills ||
  teacher.skills.length === 0
) {
  return res.status(400).json({
    success: false,
    message: "Please complete your resume before applying for jobs"
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

    /* =========================
       📌 RESUME SNAPSHOT (FINAL)
    ========================= */
    const application = new JobApplication({
      jobId,
      teacherUid,
      instituteUid: job.instituteUid,
      resumeSnapshot: {
        about: teacher.about,
        skills: teacher.skills || [],
        education: teacher.education
      }
    });

    await application.save();

    /* =========================
       🔔 NOTIFICATION (INSTITUTE)
    ========================= */
    await Notification.create({
      userUid: job.instituteUid,
      userType: "institute",
      title: "New Job Application",
      message: `A teacher has applied for your job: ${job.title}`
    });

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

    const existingInvite = await Invite.findOne({
      fromUid: application.instituteUid,
      toUid: application.teacherUid,
      status: "accepted"
    });

    if (!existingInvite) {
      await Invite.create({
        fromType: "institute",
        fromUid: application.instituteUid,
        toType: "teacher",
        toUid: application.teacherUid,
        status: "accepted",
        acceptedAt: new Date()
      });
    }

    await Notification.create({
      userUid: application.teacherUid,
      userType: "teacher",
      title: "Application Shortlisted 🎉",
      message: "You can now chat with the institute."
    });

    res.json({
      success: true,
      message: "Applicant shortlisted & chat unlocked"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* =================================================
   INSTITUTE → REJECT APPLICANT
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

    await Notification.create({
      userUid: application.teacherUid,
      userType: "teacher",
      title: "Application Update",
      message: "Your job application was not selected this time."
    });

    res.json({
      success: true,
      message: "Applicant rejected"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

module.exports = router;
