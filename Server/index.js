const express = require("express");
const bodyParser = require("body-parser");
const { Server } = require("socket.io");

const app = express();
app.use(bodyParser.json());

const EXPRESS_PORT = process.env.PORT || 8000;
const SOCKET_PORT = 8001;
const CLIENT_URL = process.env.CLIENT_URL || "*";

const io = new Server(SOCKET_PORT, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const emailToSocketMapping = new Map();
const socketToEmailMapping = new Map();

io.on("connection", (socket) => {
  console.log("🟢 User Connected:", socket.id);

  socket.on("join-room", (data) => {
    const { emailId, roomId } = data;
    console.log(`🚪 ${emailId} joined room ${roomId}`);
    emailToSocketMapping.set(emailId, socket.id);
    socketToEmailMapping.set(socket.id, emailId);
    socket.join(roomId);
    socket.emit("joined-room", { roomId });
    socket.broadcast.to(roomId).emit("user-joined", { emailId });
  });

  socket.on("call-user", (data) => {
    const { emailId, offer } = data;
    const socketId = emailToSocketMapping.get(emailId);
    const fromEmail = socketToEmailMapping.get(socket.id);
    if (!socketId) return;
    socket.to(socketId).emit("incoming-call", { from: fromEmail, offer });
  });

  socket.on("call-accepted", (data) => {
    const { emailId, ans } = data;
    const socketId = emailToSocketMapping.get(emailId);
    if (!socketId) return;
    socket.to(socketId).emit("call-accepted", { ans });
  });

  socket.on("ice-candidate", (data) => {
    const { emailId, candidate } = data;
    console.log(`🧊 ICE candidate from ${emailId}`);
    const socketId = emailToSocketMapping.get(emailId);
    if (!socketId) return;
    socket.to(socketId).emit("ice-candidate", { candidate });
  });

  socket.on("disconnect", () => {
    const email = socketToEmailMapping.get(socket.id);
    console.log("🔴 User Disconnected:", socket.id);
    if (email) {
      emailToSocketMapping.delete(email);
    }
    socketToEmailMapping.delete(socket.id);
  });
});

app.get("/", (req, res) => {
  res.send("Video Chat Backend is running!");
});

app.listen(EXPRESS_PORT, () => {
  console.log(`🚀 Express Server Running On Port ${EXPRESS_PORT}`);
});

console.log(`🔌 Socket.IO Server Running On Port ${SOCKET_PORT}`);