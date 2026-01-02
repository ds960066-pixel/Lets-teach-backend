const express = require("express");
const router = express.Router();

router.get("/browse", (req, res) => {
  res.json({ success: true, jobs: [] });
});

module.exports = router;
