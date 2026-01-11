const express = require("express");
const router = express.Router();

const Teacher = require("../models/Teacher");
const Institute = require("../models/Institute");
const ManualInstitute = require("../models/ManualInstitute");

/* =================================================
   ADMIN — PENDING VERIFICATION LIST
================================================= */

/* ---------- Pending Teachers ---------- */
router.get("/pending/teachers", async (req, res) => {
  try {
    const teachers = await Teacher.find(
      { verificationStatus: "unverified" },
      {
        _id: 0,
        uid: 1,
        name: 1,
        subject: 1,
        city: 1,
        createdAt: 1
      }
    ).sort({ createdAt: 1 });

    res.json({
      success: true,
      count: teachers.length,
      teachers
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ---------- Pending Institutes ---------- */
router.get("/pending/institutes", async (req, res) => {
  try {
    const institutes = await Institute.find(
      { verificationStatus: "unverified" },
      {
        _id: 0,
