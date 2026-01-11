const express = require("express");
const router = express.Router();
const ManualInstitute = require("../models/ManualInstitute");

/* ======================================
   ADD MANUAL INSTITUTE (ADMIN)
   POST /api/manual-institute/create
====================================== */
router.post("/create", async (req, res) => {
  try {
    const { name, city, phone, email, isRegistered, linkedInstituteUid } = req.body;

    if (!name || !city) {
      return res.status(400).json({
        success: false,
        message: "Name and city are required"
      });
    }

    const inst = new ManualInstitute({
      name,
      city,
      phone,
      email,
      isRegistered: !!isRegistered,
      linkedInstituteUid: linkedInstituteUid || null
    });

    await inst.save();

    res.json({
      success: true,
      message: "Manual institute added",
      institute: inst
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* ======================================
   PUBLIC BROWSE (CITY WISE)
   GET /api/manual-institute/browse
====================================== */
router.get("/browse", async (req, res) => {
  try {
    const q = {};
    if (req.query.city) q.city = req.query.city;

    const institutes = await ManualInstitute.find(q).sort({ name: 1 });

    res.json({
      success: true,
      institutes
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

module.exports = router;
