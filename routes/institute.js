const express = require("express");
const router = express.Router();
const Institute = require("../models/Institute");

const verifyToken = require("../middleware/verifyToken");
const requireRole = require("../middleware/requireRole");

/* ======================================
   GET LOGGED-IN INSTITUTE PROFILE
   GET /api/institute/me
====================================== */
router.get(
  "/me",
  verifyToken,
  requireRole("institute"),
  async (req, res) => {
    try {
      const institute = await Institute.findById(req.user.id);

      if (!institute) {
        return res.status(404).json({
          success: false,
          message: "Institute not found"
        });
      }

      return res.json({
        success: true,
        institute
      });

    } catch (err) {
      console.error("Get institute error:", err);
      return res.status(500).json({
        success: false,
        message: "Server error"
      });
    }
  }
);


/* ======================================
   UPDATE PROFILE
   POST /api/institute/update-profile
====================================== */
router.post(
  "/update-profile",
  verifyToken,
  requireRole("institute"),
  async (req, res) => {
    try {

      const { phone, city, address, subjectsNeeded } = req.body;

      const institute = await Institute.findById(req.user.id);

      if (!institute) {
        return res.status(404).json({
          success: false,
          message: "Institute not found"
        });
      }

      if (phone) institute.phone = phone;
      if (city) institute.city = city;
      if (address) institute.address = address;
      if (subjectsNeeded) institute.subjectsNeeded = subjectsNeeded;

      await institute.save();

      return res.json({
        success: true,
        message: "Profile updated"
      });

    } catch (err) {
      console.error("Update institute error:", err);
      return res.status(500).json({
        success: false,
        message: "Server error"
      });
    }
  }
);


/* ======================================
   PUBLIC INSTITUTES
   GET /api/institute/public
====================================== */
router.get("/public", async (req, res) => {
  try {
    const filter = { isBlocked: false };

    if (req.query.city) filter.city = req.query.city;

    const institutes = await Institute.find(filter).select(
      "name city subjectsNeeded verificationStatus"
    );

    return res.json({
      success: true,
      institutes
    });

  } catch (err) {
    console.error("Public institute error:", err);
    return res.status(500).json({
      success: false,
      institutes: []
    });
  }
});


module.exports = router;