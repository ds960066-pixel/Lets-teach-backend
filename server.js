console.log("🔥 SERVER FILE LOADED FROM DESKTOP");

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

/* ---------- Routes ---------- */
const teacherRoutes = require("./routes/teacher");
const inviteRoutes = require("./routes/invite");
const chatRoutes = require("./routes/chat");
const instituteRoutes = require("./routes/institute");

/* ---------- App Init ---------- */
const app = express();
const server = http.createServer(app);

/* ---------- Socket.IO ---------- */
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

/* ---------- Middlewares ---------- */
app.use(cors());
app.use(express.json());

/* ---------- Route Mounting ---------- */
app.use("/api/teacher", teacherRoutes);
app.use("/api/invite", inviteRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/institute", instituteRoutes);

/* ---------- Basic Routes ---------- */
app.get("/", (req, res) => {
  res.send("Lets Teach Backend is Live 🚀");
});

app.get("/health", (req, res) => {
  res.send("Server is healthy ✅");
});

/* ---------- Socket.IO Realtime Chat ---------- */
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("joinRoom", (roomId) => {
    if (!roomId) return;
    socket.join(roomId);
    console.log("Joined room:", roomId);
  });

  socket.on("sendMessage", (data) => {
    const { senderUid, receiverUid, text, roomId } = data;
    if (!senderUid || !receiverUid || !text || !roomId) return;

    io.to(roomId).emit("receiveMessage", {
      senderUid,
      receiverUid,
      text,
    });
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

/* ---------- MongoDB ---------- */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("Mongo error:", err.message));

/* ---------- Start Server ---------- */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
