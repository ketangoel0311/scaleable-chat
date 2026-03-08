'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used inside SocketProvider');
  return ctx;
};

// Generate or retrieve persistent userId (client-only)
const getOrCreateUserId = () => {
  if (typeof window === 'undefined') return null;

  let userId = window.localStorage.getItem('userId');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    window.localStorage.setItem('userId', userId);
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
  const [userId, setUserId] = useState(() => getOrCreateUserId());

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

    const keyUser = data.userId || data.from || 'unknown';
    const id = `${keyUser}-${data.timestamp}-${data.type || 'text'}`;
    if (seen.current.has(id)) return;
    seen.current.add(id);

    const type = data.type || 'text';

    setMessages((prev) => [
      ...prev,
      {
        id,
        type,
        text: type === 'text' ? data.message : '',
        fileUrl: type === 'file' ? data.fileUrl : undefined,
        fileType: type === 'file' ? data.fileType : undefined,
        filename: type === 'file' ? data.filename : undefined,
        timestamp: data.timestamp,
        from: keyUser,
        userId: data.userId,
        username: data.username || 'Unknown',
      },
    ]);
  }, []);

  useEffect(() => {
    if (!userId) {
      setUserId(getOrCreateUserId());
    }
  }, [userId]);

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
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('lastRoomId', data.roomId);
      }
    });

    s.on('room_joined', (data) => {
      setRoomId(data.roomId);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('lastRoomId', data.roomId);
      }
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
