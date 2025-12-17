const express = require("express");
const router = express.Router();

router.post("/create", (req, res) => {
  res.json({ success: true, message: "Teacher route working" });
});

module.exports = router;
