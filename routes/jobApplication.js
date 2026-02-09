const express = require("express");
const router = express.Router();

const Job = require("../models/job");
const Teacher = require("../models/Teacher");
const JobApplication = require("../models/JobApplication");

/*
=================================================
APPLY JOB
POST /api/job-application/apply
=================================================
*/
router.post("/apply", async (req, res) => {
  try {
    const { jobId, uid } = req.body;

    if (!jobId || !uid) {
      return res.status(400).json({
        success: false,
        message: "Missing jobId or uid"
      });
    }

    const teacher = await Teacher.findOne({ uid });
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
      teacherUid: uid
    });

    if (alreadyApplied) {
      return res.status(409).json({
        success: false,
        message: "Already applied"
      });
    }

    await JobApplication.create({
      jobId,
      teacherUid: uid,
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

module.exports = router;
