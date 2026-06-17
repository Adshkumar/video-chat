import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../Providers/Socket";

const HomePage = () => {
  const [email, setEmail] = useState("");
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();
  const { socket } = useSocket();

  const handleJoinRoom = (e) => {
    e.preventDefault();

    if (!email || !roomId) {
      alert("Please enter both email and room ID");
      return;
    }

    localStorage.setItem("userEmail", email);

    socket.emit("join-room", {
      emailId: email,
      roomId: roomId,
    });

    navigate(`/room/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-2">
          Video Chat
        </h1>
        <p className="text-center text-gray-500 mb-8">
          Connect with others in real-time
        </p>

        <form onSubmit={handleJoinRoom} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room ID
            </label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter room ID"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Join Room
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-500 text-center">
          Share the Room ID with others to connect
        </p>
      </div>
    </div>
  );
};

export default HomePage;
