const multer = require("multer");
const path = require("path");
const fs = require("fs");

/* ================= ENSURE UPLOADS FOLDER ================= */
const uploadDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/* ================= STORAGE ================= */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uid = req.params.uid || "unknown";
    cb(null, `resume_${uid}_${Date.now()}${ext}`);
  }
});

/* ================= FILE FILTER ================= */
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter(req, file, cb) {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF allowed"));
    }
    cb(null, true);
  }
});

module.exports = upload;
