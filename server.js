const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const admin = require("firebase-admin");

/* ---------- Firebase Admin Init ---------- */
const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

/* ---------- App Init ---------- */
const app = express();
app.use(cors());
app.use(express.json());

/* ---------- Basic Routes ---------- */
app.get("/", (req, res) => {
  res.send("Lets Teach Backend is Live 🚀");
});

app.get("/health", (req, res) => {
  res.send("Server is healthy ✅");
});

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "Lets Teach API working 🚀",
  });
});

/* ---------- OTP VERIFY API ---------- */
app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "ID Token required",
      });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);

    res.json({
      success: true,
      uid: decodedToken.uid,
      phone: decodedToken.phone_number,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
});

/* ---------- MongoDB ---------- */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

/* ---------- Server ---------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});




