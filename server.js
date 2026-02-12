console.log("🔥 SERVER FILE LOADED FROM DESKTOP");

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

/* ---------- Models ---------- */
const Message = require("./models/Message");
const Invite = require("./models/Invite");
const Teacher = require("./models/Teacher");
const Institute = require("./models/Institute");

/* ---------- Routes ---------- */
const teacherRoutes = require("./routes/teacher");
const instituteRoutes = require("./routes/institute");
const inviteRoutes = require("./routes/invite");
const chatRoutes = require("./routes/chat");
const adminRoutes = require("./routes/admin");
const jobRoutes = require("./routes/job");
const jobApplicationRoutes = require("./routes/jobApplication");
const notificationRoutes = require("./routes/notification");
const manualInstituteRoutes = require("./routes/manualInstitute");

/* ---------- App Init ---------- */
const app = express();
const server = http.createServer(app);

/* ---------- Socket.IO ---------- */
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

/* ---------- Middlewares ---------- */
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

/* =================================================
   ROUTE MOUNTING (FINAL & CLEAN)
================================================= */

/* Core */
app.use("/api/teacher", teacherRoutes);
app.use("/api/institute", instituteRoutes);
app.use("/api/invite", inviteRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoutes);

/* Jobs (NO OTP, SINGLE SOURCE) */
app.use("/api/job", jobRoutes);

/* Job Applications (SEPARATE PATH) */
app.use("/api/job-application", jobApplicationRoutes);

/* Others */
app.use("/api/notification", notificationRoutes);
app.use("/api/manual-institute", manualInstituteRoutes);

/* =================================================
   PUBLIC HOMEPAGE APIs
================================================= */

/* ---------- PUBLIC TEACHERS ---------- */
app.get("/api/teachers", async (req, res) => {
  try {
    const filter = { isBlocked: false };

    if (req.query.city) filter.city = req.query.city;
    if (req.query.subject) filter.subject = req.query.subject;

    const teachers = await Teacher.find(filter).select(
      "uid name subject city experience role verificationStatus"
    );

    return res.json({ success: true, teachers });
  } catch (err) {
    console.error("Error /api/teachers:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* ---------- PUBLIC INSTITUTES ---------- */
app.get("/api/institutes", async (req, res) => {
  try {
    const filter = { isBlocked: false };

    if (req.query.city) filter.city = req.query.city;

    const institutes = await Institute.find(filter).select(
      "uid name city verificationStatus"
    );

    return res.json({ success: true, institutes });
  } catch (err) {
    console.error("Error /api/institutes:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* ---------- BASIC ROUTES ---------- */
app.get("/", (req, res) => {
  res.send("Lets Teach Backend is Live 🚀");
});

app.get("/health", (req, res) => {
  res.send("Server is healthy ✅");
});

/* =================================================
   SOCKET.IO – REALTIME CHAT
================================================= */
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("joinRoom", (roomId) => {
    if (!roomId) return;
    socket.join(roomId);
    console.log("Joined room:", roomId);
  });

  socket.on("sendMessage", async (data) => {
    try {
      const { senderUid, receiverUid, text, roomId } = data;
      if (!senderUid || !receiverUid || !text || !roomId) return;

      const invite = await Invite.findOne({
        $or: [
          { fromUid: senderUid, toUid: receiverUid, status: "accepted" },
          { fromUid: receiverUid, toUid: senderUid, status: "accepted" }
        ]
      });

      if (!invite) return;

      const message = new Message({
        senderUid,
        receiverUid,
        text
      });

      await message.save();

      io.to(roomId).emit("receiveMessage", {
        senderUid,
        receiverUid,
        text,
        createdAt: message.createdAt
      });
    } catch (err) {
      console.error("sendMessage error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

/* ---------- MongoDB ---------- */
mongoose
  .connect(process.env.MONGO_URI, {
    dbName: "lets-teach"   // 🔥 FORCE correct DB
  })
  .then(() => {
    console.log("MongoDB connected");
    console.log("Connected DB:", mongoose.connection.name);
  })
  .catch((err) => console.log("Mongo error:", err.message));


/* ---------- Start Server ---------- */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
