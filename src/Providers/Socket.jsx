import React, { useMemo } from "react";
import { io } from "socket.io-client";

const SocketContext = React.createContext(null);

export const useSocket = () => {
  return React.useContext(SocketContext);
};

export const SocketProvider = (props) => {
  const socket = useMemo(() => {
    // const socketInstance = io('http://localhost:8001');
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';
    
    socketInstance.on('connect', () => {
      console.log('Socket connected successfully');
    });
    
    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
    
    return socketInstance;
  }, []);
  
  return (
    <SocketContext.Provider value={{ socket }}>
      {props.children}
    </SocketContext.Provider>
  );
};