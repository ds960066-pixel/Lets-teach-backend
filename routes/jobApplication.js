console.log("🔥 jobApplication routes loaded");
const express = require("express");
const router = express.Router();

const Job = require("../models/Job");
const Teacher = require("../models/Teacher");
const Invite = require("../models/Invite");
const JobApplication = require("../models/JobApplication");
const Notification = require("../models/Notification");

/* =================================================
   APPLY TO JOB (TEACHER) ✅ RESUME MANDATORY
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

    /* 🔒 RESUME MANDATORY CHECK (FINAL) */
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
       📌 RESUME SNAPSHOT
    ========================= */
    const application = new JobApplication({
      jobId,
      teacherUid,
      instituteUid: job.instituteUid,
      resumeSnapshot: {
        about: teacher.about,
        education: teacher.education,
        skills: teacher.skills
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

    return res.json({
      success: true,
      message: "Job application submitted",
      application
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
   INSTITUTE → VIEW APPLICATIONS (WITH TEACHER + RESUME PDF)
   GET /api/job/applications/institute/:uid
================================================= */
router.get("/applications/institute/:uid", async (req, res) => {
  try {
    const applications = await JobApplication.find({
      instituteUid: req.params.uid
    }).sort({ createdAt: -1 });

    if (!applications || applications.length === 0) {
      return res.json({ success: true, applications: [] });
    }

    const teacherUids = [...new Set(applications.map(a => a.teacherUid))];

    // ✅ Teacher details (resumeUrl must exist in Teacher model)
    const teachers = await Teacher.find({ uid: { $in: teacherUids } }).select(
      "uid name phone subject city resumeUrl about education skills"
    );

    const map = {};
    teachers.forEach(t => (map[t.uid] = t));

    const enriched = applications.map(a => ({
      ...a.toObject(),
      teacher: map[a.teacherUid] || null
    }));

    return res.json({
      success: true,
      applications: enriched
    });
  } catch (err) {
    console.error("Institute applications error:", err);
    return res.status(500).json({
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

    return res.json({
      success: true,
      applications
    });
  } catch (err) {
    console.error("Teacher applications error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

module.exports = router;
