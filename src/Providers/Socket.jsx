import React, { useMemo } from "react";
import { io } from "socket.io-client";

const SocketContext = React.createContext(null);

export const useSocket = () => {
  const context = React.useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const socket = useMemo(() => {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';
    console.log('🔌 Connecting to:', BACKEND_URL);
    
    const socketInstance = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    socketInstance.on('connect', () => {
      console.log('✅ Socket connected successfully');
    });
    
    socketInstance.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });
    
    socketInstance.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
    });
    
    return socketInstance;
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};