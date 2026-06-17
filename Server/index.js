const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Replace with frontend URL in production
    methods: ["GET", "POST"],
  },
});

const emailToSocketMapping = new Map();
const socketToEmailMapping = new Map();

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join-room", ({ emailId, roomId }) => {
    console.log(`${emailId} joined room ${roomId}`);

    emailToSocketMapping.set(emailId, socket.id);
    socketToEmailMapping.set(socket.id, emailId);

    socket.join(roomId);

    socket.emit("joined-room", {
      roomId,
    });

    socket.to(roomId).emit("user-joined", {
      emailId,
    });
  });

  socket.on("call-user", ({ emailId, offer }) => {
    const socketId = emailToSocketMapping.get(emailId);
    const fromEmail = socketToEmailMapping.get(socket.id);

    if (!socketId) {
      console.log(`User ${emailId} not found`);
      return;
    }

    io.to(socketId).emit("incoming-call", {
      from: fromEmail,
      offer,
    });
  });

  socket.on("call-accepted", ({ emailId, ans }) => {
    const socketId = emailToSocketMapping.get(emailId);

    if (!socketId) {
      console.log(`User ${emailId} not found`);
      return;
    }

    io.to(socketId).emit("call-accepted", {
      ans,
    });
  });

  socket.on("disconnect", () => {
    const email = socketToEmailMapping.get(socket.id);

    console.log(`User Disconnected: ${socket.id}`);

    if (email) {
      emailToSocketMapping.delete(email);
    }

    socketToEmailMapping.delete(socket.id);
  });
});

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});