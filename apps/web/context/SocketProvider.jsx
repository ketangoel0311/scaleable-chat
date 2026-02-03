'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used inside SocketProvider');
  return ctx;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  // prevent duplicates when Redis replays
  const seen = useRef(new Set());

  const sendMessage = useCallback(
    (text) => {
      if (!text.trim() || !socket?.connected) return;
      socket.emit('event:message', { message: text });
    },
    [socket]
  );

  const onMessageReceived = useCallback((data) => {
    if (!data || !data.timestamp) return;

    const id = `${data.from}-${data.timestamp}`;
    if (seen.current.has(id)) return;
    seen.current.add(id);

    setMessages((prev) => [
      ...prev,
      {
        id,
        text: data.message,
        timestamp: data.timestamp,
        from: data.from,
      },
    ]);
  }, []);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8000';
    const s = io(url, { transports: ['websocket'] });

    s.on('connect', () => setIsConnected(true));
    s.on('disconnect', () => setIsConnected(false));
    s.on('message', onMessageReceived);

    setSocket(s);

    return () => {
      s.off('message', onMessageReceived);
      s.disconnect();
    };
  }, [onMessageReceived]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        messages,
        sendMessage,
        isConnected,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

// 'use client';

// import React, { useCallback, useContext, useEffect, useState } from 'react';
// import { io } from 'socket.io-client';

// /**
//  * Socket context for managing WebSocket connections
//  */
// const SocketContext = React.createContext(null);

// /**
//  * Custom hook to access socket context
//  */
// export const useSocket = () => {
//   const state = useContext(SocketContext);
//   if (!state) {
//     throw new Error('useSocket must be used within SocketProvider');
//   }
//   return state;
// };

// /**
//  * Socket provider component - wraps app with real-time communication
//  */
// export const SocketProvider = ({ children }) => {
//   const [socket, setSocket] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [isConnected, setIsConnected] = useState(false);
//   const [isTyping, setIsTyping] = useState(false);

//   /**
//    * Send message through WebSocket
//    */
//   const sendMessage = useCallback(
//     (msg) => {
//       if (!msg.trim()) return;

//       console.log('[SocketProvider] Sending message:', msg);
//       if (socket && socket.connected) {
//         socket.emit('event:message', { message: msg });
//       } else {
//         console.error('[SocketProvider] Socket not connected');
//       }
//     },
//     [socket]
//   );

//   /**
//    * Handle incoming messages from server
//    */
//   const onMessageReceived = useCallback((data) => {
//     try {
//       const parsed = data;
//       //const parsed = JSON.parse(data);
//       console.log('[SocketProvider] Message received:', parsed);
//       setMessages((prev) => [
//         ...prev,
//         {
//           id: Date.now(),
//           text: parsed.message,
//           timestamp: parsed.timestamp || Date.now(),
//           from: parsed.from || 'other',
//         },
//       ]);
//     } catch (error) {
//       console.error('[SocketProvider] Error parsing message:', error);
//     }
//   }, []);

//   /**
//    * Initialize Socket.IO connection
//    */
//   useEffect(() => {
//     console.log('[SocketProvider] Initializing socket connection...');

//     const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8000';
//     const newSocket = io(socketUrl, {
//       reconnection: true,
//       reconnectionDelay: 1000,
//       reconnectionDelayMax: 5000,
//       reconnectionAttempts: 5,
//     });

//     // Connection established
//     newSocket.on('connect', () => {
//       console.log('[SocketProvider] Connected to server:', newSocket.id);
//       setIsConnected(true);
//     });

//     // Receive messages
//     newSocket.on('message', onMessageReceived);

//     // Disconnected
//     newSocket.on('disconnect', (reason) => {
//       console.log('[SocketProvider] Disconnected:', reason);
//       setIsConnected(false);
//     });

//     // Connection errors
//     newSocket.on('error', (error) => {
//       console.error('[SocketProvider] Socket error:', error);
//     });

//     setSocket(newSocket);

//     // Cleanup on unmount
//     return () => {
//       console.log('[SocketProvider] Cleaning up socket connection...');
//       newSocket.off('message', onMessageReceived);
//       newSocket.disconnect();
//     };
//   }, [onMessageReceived]);

//   return (
//     <SocketContext.Provider
//       value={{
//         socket,
//         sendMessage,
//         messages,
//         isConnected,
//         isTyping,
//         setIsTyping,
//       }}
//     >
//       {children}
//     </SocketContext.Provider>
//   );
// };
