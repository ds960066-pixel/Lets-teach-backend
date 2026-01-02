require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

/* ---------- ROUTES ---------- */
const teacherRoutes = require("./routes/teacher");
const inviteRoutes = require("./routes/invite");
const chatRoutes = require("./routes/chat");
const instituteRoutes = require("./routes/institute");

/* ---------- APP INIT ---------- */
const app = express();
const server = http.createServer(app);

/* ---------- SOCKET.IO ---------- */
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

/* ---------- MIDDLEWARE ---------- */
app.use(cors());
app.use(express.json());

/* ---------- ROUTE REGISTRATION (IMPORTANT ORDER) ---------- */
app.use("/api/teacher", teacherRoutes);
app.use("/api/invite", inviteRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/institute", instituteRoutes); // ✅ THIS ENABLES /browse

/* ---------- BASIC ROUTES ---------- */
app.get("/", (req, res) => {
  res.send("Lets Teach Backend is Live 🚀");
});

app.get("/health", (req, res) => {
  res.send("Server is healthy ✅");
});

app.get("/api/test", (req, res) => {
  res.json({ success: true, message: "API working" });
});

/* ---------- SOCKET EVENTS ---------- */
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("joinRoom", (roomId) => {
    if (!roomId) return;
    socket.join(roomId);
    console.log("Joined room:", roomId);
  });

  socket.on("sendMessage", async ({ senderUid, receiverUid, text, roomId }) => {
    if (!senderUid || !receiverUid || !text || !roomId) return;

    const Message = require("./models/Message");

    const msg = new Message({
      senderUid,
      receiverUid,
      text,
    });

    await msg.save();

    io.to(roomId).emit("receiveMessage", msg);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

/* ---------- MONGODB ---------- */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("Mongo error:", err.message));

/* ---------- START SERVER ---------- */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
