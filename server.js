const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

/* ---------- Models ---------- */
const Teacher = require("./models/Teacher");
const Institute = require("./models/Institute");
const Invite = require("./models/Invite");
const Message = require("./models/Message");

/* ---------- Routes ---------- */
const teacherRoutes = require("./routes/teacher");
const inviteRoutes = require("./routes/invite");
const chatRoutes = require("./routes/chat");

/* ---------- App + Server ---------- */
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

/* ---------- API Routes ---------- */
app.use("/api/teacher", teacherRoutes);
app.use("/api/invite", inviteRoutes);
app.use("/api/chat", chatRoutes);

/* ---------- Test Routes ---------- */
app.get("/", (req, res) => {
  res.send("Lets Teach Backend is Live 🚀");
});

app.get("/health", (req, res) => {
  res.send("Server is healthy ✅");
});

/* ---------- CHAT REST (history) ---------- */
app.post("/api/chat/send", async (req, res) => {
  try {
    const { senderUid, receiverUid, text } = req.body;

    if (!senderUid || !receiverUid || !text) {
      return res.status(400).json({ success: false });
    }

    const message = new Message({ senderUid, receiverUid, text });
    await message.save();

    res.json({ success: true, data: message });
  } catch (err) {
    res.status(500).json({ success: false });
  }
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

/* ---------- SOCKET.IO (Realtime Chat) ---------- */
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
  });

  socket.on("sendMessage", async ({ senderUid, receiverUid, text, roomId }) => {
    const message = new Message({ senderUid, receiverUid, text });
    await message.save();

    io.to(roomId).emit("receiveMessage", message);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
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
