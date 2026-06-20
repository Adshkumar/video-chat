const express = require("express");
const { Server } = require("socket.io");
const http = require("http");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8000;

// Allow multiple origins for CORS (production + local dev)
const ALLOWED_ORIGINS = [
  "https://video-chat-ten-beryl.vercel.app",
  "https://video-chat-git-main-adshkumars-projects.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
];

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      // Also allow any vercel.app subdomain for preview deployments
      if (origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }
      console.log(`⛔ CORS blocked origin: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
  // Production socket.io settings
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ["websocket", "polling"],
});

const emailToSocketMapping = new Map();
const socketToEmailMapping = new Map();
const roomMembersMapping = new Map();

io.on("connection", (socket) => {
  console.log("🟢 User Connected:", socket.id);

  socket.on("join-room", (data) => {
    const { emailId, roomId } = data;
    if (!emailId || !roomId) {
      console.log("❌ Missing emailId or roomId");
      return;
    }

    console.log(`🚪 ${emailId} joined room ${roomId}`);
    emailToSocketMapping.set(emailId, socket.id);
    socketToEmailMapping.set(socket.id, emailId);

    // Track room members
    if (!roomMembersMapping.has(roomId)) {
      roomMembersMapping.set(roomId, new Set());
    }
    roomMembersMapping.get(roomId).add(emailId);

    socket.join(roomId);
    socket.emit("joined-room", { roomId });
    socket.broadcast.to(roomId).emit("user-joined", { emailId });
  });

  socket.on("call-user", (data) => {
    const { emailId, offer } = data;
    if (!emailId || !offer) return;
    
    const socketId = emailToSocketMapping.get(emailId);
    const fromEmail = socketToEmailMapping.get(socket.id);
    if (!socketId || !fromEmail) {
      console.log(`❌ Cannot find target socket for ${emailId}`);
      return;
    }
    
    console.log(`📞 ${fromEmail} calling ${emailId}`);
    socket.to(socketId).emit("incoming-call", { from: fromEmail, offer });
  });

  socket.on("call-accepted", (data) => {
    const { emailId, ans } = data;
    if (!emailId || !ans) return;
    
    const socketId = emailToSocketMapping.get(emailId);
    if (!socketId) {
      console.log(`❌ Cannot find target socket for ${emailId}`);
      return;
    }
    
    console.log(`✅ Call accepted by ${socketToEmailMapping.get(socket.id)}`);
    socket.to(socketId).emit("call-accepted", { ans });
  });

  socket.on("ice-candidate", (data) => {
    const { emailId, candidate } = data;
    if (!emailId || !candidate) return;
    
    const socketId = emailToSocketMapping.get(emailId);
    if (!socketId) return;
    socket.to(socketId).emit("ice-candidate", { candidate });
  });

  socket.on("disconnect", () => {
    const email = socketToEmailMapping.get(socket.id);
    console.log("🔴 User Disconnected:", socket.id, email || "");

    if (email) {
      emailToSocketMapping.delete(email);

      // Remove from room members and notify others
      for (const [roomId, members] of roomMembersMapping.entries()) {
        if (members.has(email)) {
          members.delete(email);
          socket.broadcast.to(roomId).emit("user-disconnected", { emailId: email });
          if (members.size === 0) {
            roomMembersMapping.delete(roomId);
          }
          break;
        }
      }
    }
    socketToEmailMapping.delete(socket.id);
  });
});

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Video Chat Backend is running!",
    connectedUsers: emailToSocketMapping.size,
    activeRooms: roomMembersMapping.size,
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

server.listen(PORT, () => {
  console.log(`🚀 Server Running On Port ${PORT}`);
  console.log(`📡 Allowed Origins: ${ALLOWED_ORIGINS.join(", ")}`);
});