const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const Teacher = require("./models/Teacher");
const Institute = require("./models/Institute");
const Invite = require("./models/Invite");
const Message = require("./models/Message");

const teacherRoutes = require("./routes/teacher");
const inviteRoutes = require("./routes/invite");
const chatRoutes = require("./routes/chat");

/* ---------- App + Server Init ---------- */
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

/* ---------- Routes ---------- */
app.use("/api/teacher", teacherRoutes);
app.use("/api/invite", inviteRoutes);
app.use("/api/chat", chatRoutes);

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

/* ---------- DEBUG ---------- */
app.get("/api/debug/teachers", async (req, res) => {
  const teachers = await Teacher.find();
  res.json({ success: true, count: teachers.length, teachers });
});

/* ---------- CHAT REST APIs ---------- */
app.post("/api/chat/send", async (req, res) => {
  const { senderUid, receiverUid, text } = req.body;

  if (!senderUid || !receiverUid || !text) {
    return res.status(400).json({ success: false });
  }

  const message = new Message({ senderUid, receiverUid, text });
  await message.save();

  res.json({ success: true, data: message });
});

app.get("/api/chat/:uid1/:uid2", async (req, res) => {
  const { uid1, uid2 } = req.params;

  const messages = await Message.find({
    $or: [
      { senderUid: uid1, receiverUid: uid2 },
      { senderUid: uid2, receiverUid: uid1 },
    ],
  }).sort({ createdAt: 1 });

  res.json({ success: true, messages });
});

/* ---------- SOCKET.IO ---------- */
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
  });

  socket.on("sendMessage", async (data) => {
    const { senderUid, receiverUid, text, roomId } = data;

    const message = new Message({ senderUid, receiverUid, text });
    await message.save();

    io.to(roomId).emit("receiveMessage", message);
  });
});

/* ---------- MongoDB ---------- */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

/* ---------- Start Server ---------- */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
