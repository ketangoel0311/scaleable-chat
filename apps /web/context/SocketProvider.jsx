'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used inside SocketProvider');
  return ctx;
};

// Generate or retrieve persistent userId
const getOrCreateUserId = () => {
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    localStorage.setItem('userId', userId);
  }
  return userId;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [username, setUsername] = useState(null);
  const [socketId, setSocketId] = useState(null);
  const [roomUsers, setRoomUsers] = useState([]);
  const [userId] = useState(() => getOrCreateUserId());

  const seen = useRef(new Set());
  const prevConnectedRef = useRef(false);

  const resetRoomState = useCallback(() => {
    setMessages([]);
    seen.current = new Set();
  }, []);

  const createRoom = useCallback(
    (name) => {
      if (!socket?.connected) return;
      resetRoomState();
      setUsername(name);
      socket.emit('create_room', { username: name, userId });
    },
    [socket, resetRoomState, userId]
  );

  const joinRoom = useCallback(
    (rid, name) => {
      if (!socket?.connected) return;
      resetRoomState();
      setUsername(name);
      socket.emit('join_room', { roomId: rid, username: name, userId });
    },
    [socket, resetRoomState, userId]
  );

  const leaveRoom = useCallback(() => {
    setRoomId(null);
    setUsername(null);
    resetRoomState();
  }, [resetRoomState]);

  const sendMessage = useCallback(
    (text) => {
      if (!text.trim() || !socket?.connected) return;
      socket.emit('event:message', { message: text, roomId, userId });
    },
    [socket, roomId, userId]
  );
  const onMessageReceived = useCallback((data) => {
    if (!data || !data.timestamp) return;

    const id = `${data.userId || data.from}-${data.timestamp}`;
    if (seen.current.has(id)) return;
    seen.current.add(id);

    setMessages((prev) => [
      ...prev,
      {
        id,
        type: 'text',
        text: data.message,
        timestamp: data.timestamp,
        from: data.userId || data.from,
        userId: data.userId,
        username: data.username || 'Unknown',
      },
    ]);
  }, []);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8000';
    const s = io(url, { transports: ['websocket'] });

    s.on('connect', () => {
      setIsConnected(true);
      setSocketId(s.id);
    });

    s.on('disconnect', () => {
      setIsConnected(false);
      setSocketId(null);
    });

    s.on('message', onMessageReceived);

    s.on('room_created', (data) => {
      setRoomId(data.roomId);
      localStorage.setItem('lastRoomId', data.roomId);
    });

    s.on('room_joined', (data) => {
      setRoomId(data.roomId);
      localStorage.setItem('lastRoomId', data.roomId);
    });

    s.on('user_joined', () => {
      // User list will be updated via room_users event
    });

    s.on('user_left', () => {
      // User list will be updated via room_users event
    });

    s.on('room_users', (users) => {
      setRoomUsers(users || []);
    });

    setSocket(s);

    return () => {
      s.off('message', onMessageReceived);
      s.off('room_created');
      s.off('room_joined');
      s.disconnect();
    };
  }, [onMessageReceived]);

  // When socket reconnects and we already have a room + username,
  // automatically re-join the room so presence and ONLINE status recover
  useEffect(() => {
    if (
      isConnected &&
      !prevConnectedRef.current &&
      socket &&
      roomId &&
      username
    ) {
      socket.emit('join_room', { roomId, username, userId });
    }
    prevConnectedRef.current = isConnected;
  }, [isConnected, roomId, username, socket, userId]);

  // On tab visibility / focus coming back, ensure socket is connected
  useEffect(() => {
    if (!socket) return;

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible' && !socket.connected) {
        socket.connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [socket]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        messages,
        sendMessage,
        isConnected,
        roomId,
        createRoom,
        joinRoom,
        leaveRoom,
        username,
        socketId,
        roomUsers,
        userId,
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
