const express = require("express");
const router = express.Router();

const Job = require("../models/job");
const Teacher = require("../models/Teacher");
const JobApplication = require("../models/JobApplication");
const { requireRole } = require("../middleware/auth");

/*
=================================================
APPLY JOB (Teacher Only)
POST /api/job-application/apply
=================================================
*/
router.post("/apply", requireRole("teacher"), async (req, res) => {
  try {
    const { jobId } = req.body;
    const teacherUid = req.user.uid;   // 🔥 from middleware

    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: "Missing jobId"
      });
    }

    const teacher = await Teacher.findOne({ uid: String(teacherUid).trim() });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found"
      });
    }

    const job = await Job.findById(jobId);
    if (!job || job.status !== "open") {
      return res.status(404).json({
        success: false,
        message: "Job not available"
      });
    }

    const alreadyApplied = await JobApplication.findOne({
      jobId,
      teacherUid
    });

    if (alreadyApplied) {
      return res.status(409).json({
        success: false,
        message: "Already applied"
      });
    }

    await JobApplication.create({
      jobId,
      teacherUid,
      instituteUid: job.instituteUid,
      resumeSnapshot: {
        about: teacher.resumeText || "",
        skills: Array.isArray(teacher.skills) ? teacher.skills : [],
        education: teacher.education || ""
      },
      status: "applied"
    });

    return res.json({
      success: true,
      message: "Job applied successfully"
    });

  } catch (err) {
    console.error("Apply job error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});


/*
=================================================
INSTITUTE RECEIVED APPLICATIONS (Institute Only)
GET /api/job-application/institute/:uid
=================================================
*/
router.get("/institute/:uid", requireRole("institute"), async (req, res) => {
  try {
    const instituteUid = String(req.params.uid).trim();

    // 🔥 Extra safety: UID match with header
    if (req.user.uid !== instituteUid) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access"
      });
    }

    const applications = await JobApplication.find({ instituteUid })
      .populate("jobId", "title subject city role")
      .lean();

    for (let app of applications) {
      const teacher = await Teacher.findOne({ uid: app.teacherUid })
        .select("name city subject resumeUrl")
        .lean();

      app.teacher = teacher || null;
    }

    return res.json({
      success: true,
      applications
    });

  } catch (err) {
    console.error("Institute applications error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});


/*
=================================================
UPDATE APPLICATION STATUS (Institute Only)
POST /api/job-application/update-status
=================================================
*/
router.post("/update-status", requireRole("institute"), async (req, res) => {
  try {
    const { applicationId, status } = req.body;

    if (!applicationId || !["shortlisted", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request"
      });
    }

    const application = await JobApplication.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    // 🔥 Security check: Only same institute can update
    if (application.instituteUid !== req.user.uid) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    application.status = status;
    await application.save();

    return res.json({
      success: true,
      message: "Status updated successfully"
    });

  } catch (err) {
    console.error("Update status error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});


/*
=================================================
TEACHER APPLIED JOBS (Teacher Only)
GET /api/job-application/teacher/:uid
=================================================
*/
router.get("/teacher/:uid", requireRole("teacher"), async (req, res) => {
  try {
    const teacherUid = String(req.params.uid).trim();

    if (req.user.uid !== teacherUid) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access"
      });
    }

    const applications = await JobApplication.find({ teacherUid })
      .populate("jobId", "title subject city role")
      .lean();

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
