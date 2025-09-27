// frontend/src/contexts/SocketContext.jsx
import React, { createContext, useContext, useEffect } from 'react';
import socketService from '../services/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (isLoggedIn()) {
      socketService.connect();
    } else {
      socketService.disconnect();
    }

    return () => {
      socketService.disconnect();
    };
  }, [isLoggedIn()]);

  const value = {
    socket: socketService.getSocket(),
    joinPoll: socketService.joinPoll.bind(socketService),
    leavePoll: socketService.leavePoll.bind(socketService),
    onVoteCast: socketService.onVoteCast.bind(socketService),
    offVoteCast: socketService.offVoteCast.bind(socketService),
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};