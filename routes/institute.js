console.log(" INSTITUTE ROUTES LOADED ");

const express = require("express");
const router = express.Router();
const Institute = require("../models/Institute");

/**
 * CREATE INSTITUTE
 */
router.post("/create", async (req, res) => {
  try {
    const { uid, name, phone, city, address, subjectsNeeded } = req.body;

    if (!uid || !name || !phone || !city) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    const existing = await Institute.findOne({ uid });
    if (existing) {
      return res.json({
        success: false,
        message: "Institute already exists",
      });
    }

    const institute = new Institute({
      uid,
      name,
      phone,
      city,
      address,
      subjectsNeeded,
    });

    await institute.save();

    res.json({
      success: true,
      institute,
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

/**
 * PUBLIC BROWSE INSTITUTES
 */
router.get("/browse", async (req, res) => {
  try {
    const filter = {};
    if (req.query.city) filter.city = req.query.city;

    const institutes = await Institute.find(filter).select(
      "uid name city subjectsNeeded"
    );

    res.json({
      success: true,
      institutes,
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

/**
 * GET INSTITUTE BY UID
 */
router.get("/:uid", async (req, res) => {
  try {
    const institute = await Institute.findOne({ uid: req.params.uid });

    if (!institute) {
      return res.status(404).json({
        success: false,
        message: "Institute not found",
      });
    }

    res.json({
      success: true,
      institute,
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

module.exports = router;
