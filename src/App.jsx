import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SocketProvider } from "./Providers/Socket";
import { PeerProvider } from "./Providers/Peer";
import HomePage from "./pages/Home";
import RoomPage from "./pages/Room";
import "./App.css";

function App() {
  return (
    <SocketProvider>
      <PeerProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/room/:roomId" element={<RoomPage />} />
          </Routes>
        </BrowserRouter>
      </PeerProvider>
    </SocketProvider>
  );
}

export default App;