const express = require("express");
const router = express.Router();
const ManualInstitute = require("../models/ManualInstitute");

/* ======================================
   PUBLIC INSTITUTE DIRECTORY
   GET /api/public/institutes
====================================== */
router.get("/institutes", async (req, res) => {
  try {
    const filter = {};
    if (req.query.city) filter.city = req.query.city;

    const institutes = await ManualInstitute.find(filter).select(
      "name city phone email isRegistered"
    );

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
