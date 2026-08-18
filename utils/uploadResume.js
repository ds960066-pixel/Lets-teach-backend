const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

/* ================= CLOUDINARY STORAGE ================= */

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "lets-teach/resumes",
    resource_type: "raw",
    allowed_formats: ["pdf"]
  }
});

/* ================= MULTER ================= */

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },

  fileFilter(req, file, cb) {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF allowed"));
    }

    cb(null, true);
  }
});

module.exports = upload;