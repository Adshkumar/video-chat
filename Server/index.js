const express = require("express");
const bodyParser = require("body-parser");
const { Server } = require("socket.io");

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 8001;
const CLIENT_URL = process.env.CLIENT_URL || "*";

const io = new Server(PORT, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const emailToSocketMapping = new Map();
const socketToEmailMapping = new Map();

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  socket.on("join-room", (data) => {
    const { emailId, roomId } = data;
    console.log(`${emailId} joined room ${roomId}`);

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
    console.log(`ICE candidate from ${emailId}`);
    const socketId = emailToSocketMapping.get(emailId);
    if (!socketId) {
      console.log(`No socket found for ${emailId}`);
      return;
    }
    socket.to(socketId).emit("ice-candidate", { candidate });
  });

  socket.on("disconnect", () => {
    const email = socketToEmailMapping.get(socket.id);
    console.log("User Disconnected:", socket.id);
    if (email) {
      emailToSocketMapping.delete(email);
    }
    socketToEmailMapping.delete(socket.id);
  });
});

app.listen(PORT, () => {
  console.log(`Server Running On Port ${PORT}`);
});