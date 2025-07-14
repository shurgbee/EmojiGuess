import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useWebSocket } from 'react-use-websocket/src/lib/use-websocket';

interface WebSocketContextType {
  sendJsonMessage: (message: any) => void;
  lastMessage: MessageEvent | null;
  readyState: number;
  connectionStatus: string;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const WS_URL = 'ws://localhost:8000/ws/match';
  
  const { sendJsonMessage, lastMessage, readyState } = useWebSocket(WS_URL, {
    share: true, // This is key - allows sharing connection across components
    shouldReconnect: () => true,
    reconnectAttempts: 10,
    reconnectInterval: 3000,
  });

  const getConnectionStatus = (state: number): string => {
    switch (state) {
      case 0: return 'Connecting';
      case 1: return 'Open';
      case 2: return 'Closing';
      case 3: return 'Closed';
      default: return 'Unknown';
    }
  };

  const connectionStatus = getConnectionStatus(readyState);

  const value = {
    sendJsonMessage,
    lastMessage,
    readyState,
    connectionStatus,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};
