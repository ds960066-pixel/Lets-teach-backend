const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const admin = require("firebase-admin");

const Teacher = require("./models/Teacher");
const Institute = require("./models/Institute");
const Invite = require("./models/Invite");
const Message = require("./models/Message");

/* ---------- Firebase Admin Init ---------- */
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT not found");
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

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

/* ---------- TEACHER APIs ---------- */
app.post("/api/teacher/create", async (req, res) => {
  try {
    const { uid, name, phone, subject, city, experience } = req.body;

    if (!uid || !name || !phone || !subject || !city) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled",
      });
    }

    const existingTeacher = await Teacher.findOne({ uid });
    if (existingTeacher) {
      return res.status(400).json({
        success: false,
        message: "Teacher profile already exists",
      });
    }

    const teacher = new Teacher({
      uid,
      name,
      phone,
      subject,
      city,
      experience,
    });

    await teacher.save();

    res.json({
      success: true,
      message: "Teacher profile created successfully",
      teacher,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

app.get("/api/teacher/:uid", async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ uid: req.params.uid });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    res.json({
      success: true,
      teacher,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/* ---------- INSTITUTE APIs ---------- */
app.post("/api/institute/create", async (req, res) => {
  try {
    const { uid, name, phone, city, address, subjectsNeeded } = req.body;

    if (!uid || !name || !phone || !city) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled",
      });
    }

    const existingInstitute = await Institute.findOne({ uid });
    if (existingInstitute) {
      return res.status(400).json({
        success: false,
        message: "Institute profile already exists",
      });
    }

    const institute = new Institute({
      uid,
      name,
      phone,
      city,
      address,
      subjectsNeeded,
    });

    await institute.save();

    res.json({
      success: true,
      message: "Institute profile created successfully",
      institute,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

app.get("/api/institute/:uid", async (req, res) => {
  try {
    const institute = await Institute.findOne({ uid: req.params.uid });

    if (!institute) {
      return res.status(404).json({
        success: false,
        message: "Institute not found",
      });
    }

    res.json({
      success: true,
      institute,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/* ---------- INVITE APIs ---------- */
app.post("/api/invite/create", async (req, res) => {
  try {
    const { instituteUid, teacherUid } = req.body;

    if (!instituteUid || !teacherUid) {
      return res.status(400).json({
        success: false,
        message: "Institute UID and Teacher UID required",
      });
    }

    const existingInvite = await Invite.findOne({ instituteUid, teacherUid });
    if (existingInvite) {
      return res.status(400).json({
        success: false,
        message: "Invite already sent",
      });
    }

    const invite = new Invite({ instituteUid, teacherUid });
    await invite.save();

    res.json({
      success: true,
      message: "Invite sent successfully",
      invite,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

app.get("/api/invite/teacher/:uid", async (req, res) => {
  try {
    const invites = await Invite.find({ teacherUid: req.params.uid });

    res.json({
      success: true,
      invites,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

app.post("/api/invite/respond", async (req, res) => {
  try {
    const { inviteId, status } = req.body;

    if (!inviteId || !status) {
      return res.status(400).json({
        success: false,
        message: "Invite ID and status required",
      });
    }

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const invite = await Invite.findById(inviteId);
    if (!invite) {
      return res.status(404).json({
        success: false,
        message: "Invite not found",
      });
    }

    invite.status = status;
    await invite.save();

    res.json({
      success: true,
      message: `Invite ${status}`,
      invite,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/* ---------- CHAT APIs ---------- */
app.post("/api/chat/send", async (req, res) => {
  try {
    const { senderUid, receiverUid, text } = req.body;

    if (!senderUid || !receiverUid || !text) {
      return res.status(400).json({
        success: false,
        message: "All fields required",
      });
    }

    const message = new Message({ senderUid, receiverUid, text });
    await message.save();

    res.json({
      success: true,
      message: "Message sent",
      data: message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

app.get("/api/chat/:uid1/:uid2", async (req, res) => {
  try {
    const { uid1, uid2 } = req.params;

    const messages = await Message.find({
      $or: [
        { senderUid: uid1, receiverUid: uid2 },
        { senderUid: uid2, receiverUid: uid1 },
      ],
    }).sort({ createdAt: 1 });

    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
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




  
   
    

    
 
    

    
      
    


    
    
   

   
     

    

   
   




