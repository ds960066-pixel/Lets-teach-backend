console.log("🔥 SERVER FILE LOADED");

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

/* ================= MODELS ================= */
const Message = require("./models/Message");
const Invite = require("./models/Invite");
const Teacher = require("./models/Teacher");
const Institute = require("./models/Institute");
const JobApplication = require("./models/JobApplication");

/* ================= ROUTES ================= */
const teacherRoutes = require("./routes/teacher");
const instituteRoutes = require("./routes/institute");
const inviteRoutes = require("./routes/invite");
const chatRoutes = require("./routes/chat");
const adminRoutes = require("./routes/admin");
const jobRoutes = require("./routes/job");
const jobApplicationRoutes = require("./routes/jobApplication");
const notificationRoutes = require("./routes/notification");
const manualInstituteRoutes = require("./routes/manualInstitute");

/* ================= APP INIT ================= */
const app = express();
const server = http.createServer(app);

/* ================= SOCKET.IO ================= */
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

/* ================= MIDDLEWARES ================= */
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

/* ================= ROUTE MOUNTING ================= */
app.use("/api/teacher", teacherRoutes);
app.use("/api/institute", instituteRoutes);
app.use("/api/invite", inviteRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/job", jobRoutes);
app.use("/api/job-application", jobApplicationRoutes);
app.use("/api/notification", notificationRoutes);
app.use("/api/manual-institute", manualInstituteRoutes);

/* =================================================
   ✅ PUBLIC TEACHERS (FIXED 404 ISSUE)
================================================= */
app.get("/api/teachers", async (req, res) => {
  try {
    const filter = { isBlocked: false };

    if (req.query.city) filter.city = req.query.city;
    if (req.query.subject) filter.subject = req.query.subject;

    const teachers = await Teacher.find(filter).select(
      "uid name subject city experience role verificationStatus resumeUrl"
    );

    res.json({ success: true, teachers });
  } catch (err) {
    console.error("Error /api/teachers:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* =================================================
   ✅ PUBLIC INSTITUTES (FIXED 404 ISSUE)
================================================= */
app.get("/api/institutes", async (req, res) => {
  try {
    const filter = { isBlocked: false };

    if (req.query.city) filter.city = req.query.city;

    const institutes = await Institute.find(filter).select(
      "uid name city verificationStatus"
    );

    res.json({ success: true, institutes });
  } catch (err) {
    console.error("Error /api/institutes:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ================= BASIC ROUTES ================= */
app.get("/", (req, res) => {
  res.send("Lets Teach Backend is Live 🚀");
});

app.get("/health", (req, res) => {
  res.send("Server is healthy ✅");
});

/* =================================================
   🔥 REAL-TIME CHAT (Invite OR Shortlisted)
================================================= */
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("joinRoom", (roomId) => {
    if (!roomId) return;
    socket.join(roomId);
  });

  socket.on("sendMessage", async (data) => {
    try {
      const { senderUid, receiverUid, text, roomId } = data;
      if (!senderUid || !receiverUid || !text || !roomId) return;

      /* Check accepted invite */
      const inviteAccepted = await Invite.findOne({
        status: "accepted",
        $or: [
          { fromUid: senderUid, toUid: receiverUid },
          { fromUid: receiverUid, toUid: senderUid }
        ]
      });

      /* Check shortlisted job */
      const shortlisted = await JobApplication.findOne({
        status: "shortlisted",
        $or: [
          { teacherUid: senderUid, instituteUid: receiverUid },
          { teacherUid: receiverUid, instituteUid: senderUid }
        ]
      });

      if (!inviteAccepted && !shortlisted) {
        console.log("❌ Chat blocked (no permission)");
        return;
      }

      const message = await Message.create({
        senderUid,
        receiverUid,
        text
      });

      io.to(roomId).emit("receiveMessage", {
        senderUid,
        receiverUid,
        text,
        createdAt: message.createdAt
      });

    } catch (err) {
      console.error("Socket sendMessage error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

/* ================= MONGODB ================= */
mongoose
  .connect(process.env.MONGO_URI, {
    dbName: "lets-teach"
  })
  .then(() => {
    console.log("MongoDB connected");
    console.log("Connected DB:", mongoose.connection.name);
  })
  .catch((err) => console.log("Mongo error:", err.message));

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
