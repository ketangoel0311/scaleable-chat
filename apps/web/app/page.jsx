'use client';

import { useEffect, useRef, useState } from 'react';
import { useSocket } from '../context/SocketProvider';
import { ChatMessage, MessageInput, ConnectionStatus, UserList } from '../components';

export default function Page() {
  const {
    messages,
    isConnected,
    roomId,
    createRoom,
    joinRoom,
    leaveRoom,
    username,
    socketId,
    roomUsers,
    userId,
  } = useSocket();
  const [page, setPage] = useState('entry');
  const [createRoomName, setCreateRoomName] = useState('');
  const [joinRoomName, setJoinRoomName] = useState('');
  const [inputRoomId, setInputRoomId] = useState('');
  const bottomRef = useRef(null);
  const [highlightId, setHighlightId] = useState(null);

  useEffect(() => {
    const lastRoomId = localStorage.getItem('lastRoomId');
    const lastUsername = localStorage.getItem('lastUsername');

    if (lastRoomId && isConnected) {
      joinRoom(lastRoomId, lastUsername || 'User');
      setPage('chat');
    }
  }, [isConnected, joinRoom]);

  useEffect(() => {
    if (roomId && isConnected) {
      setPage('chat');
      localStorage.setItem('lastRoomId', roomId);
      if (username) localStorage.setItem('lastUsername', username);
    }
  }, [roomId, isConnected, username]);

  useEffect(() => {
    if (messages.length > 0) {
      const last = messages[messages.length - 1];
      setHighlightId(last.id);
      const t = setTimeout(() => setHighlightId(null), 900);
      return () => clearTimeout(t);
    }
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (createRoomName.trim()) {
      createRoom(createRoomName.trim());
      setCreateRoomName('');
    }
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (inputRoomId.trim() && joinRoomName.trim()) {
      joinRoom(inputRoomId.trim().toUpperCase(), joinRoomName.trim());
      setJoinRoomName('');
      setInputRoomId('');
    }
  };

  const handleSwitchRoom = () => {
    localStorage.removeItem('lastRoomId');
    localStorage.removeItem('lastUsername');
    leaveRoom();
    setPage('entry');
  };

  // ENTRY PAGE
  if (page === 'entry') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Scalable Chat</h1>
            <p className="mt-2 text-sm text-gray-600">Connect with unique room IDs</p>
          </div>

          <div className="space-y-6">
            {/* CREATE ROOM */}
            <form
              onSubmit={handleCreateRoom}
              className="bg-white rounded-xl shadow-sm p-6 border border-emerald-200/50"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Room</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
                  <input
                    type="text"
                    value={createRoomName}
                    onChange={(e) => setCreateRoomName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-lg hover:from-emerald-700 hover:to-teal-700 transition"
                >
                  Create Room
                </button>
              </div>
            </form>

            {/* DIVIDER */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="text-sm text-gray-500 font-medium">OR</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>

            {/* JOIN ROOM */}
            <form
              onSubmit={handleJoinRoom}
              className="bg-white rounded-xl shadow-sm p-6 border border-teal-200/50"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Join Existing Room</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room ID</label>
                  <input
                    type="text"
                    value={inputRoomId}
                    onChange={(e) => setInputRoomId(e.target.value.toUpperCase())}
                    placeholder="Enter room ID (e.g., A9f3K2xQ)"
                    maxLength="8"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-500 font-mono focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
                  <input
                    type="text"
                    value={joinRoomName}
                    onChange={(e) => setJoinRoomName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-medium rounded-lg hover:from-teal-700 hover:to-emerald-700 transition"
                >
                  Join Room
                </button>
              </div>
            </form>
          </div>

          {!isConnected && (
            <div className="text-center">
              <p className="text-sm text-amber-600">Connecting...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // CHAT PAGE
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* HEADER */}
      <header className="bg-white border-b border-emerald-200/50 shadow-sm">
        <div className="w-full px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Scalable Chat</h1>
            <div className="flex items-center gap-3 mt-1">
              <code className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-mono rounded">
                {roomId}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(roomId);
                  alert('Room ID copied!');
                }}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
              >
                Copy
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ConnectionStatus isConnected={isConnected} />
            <button
              onClick={handleSwitchRoom}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
            >
              Switch Room
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 overflow-hidden">
        {/* MESSAGES */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {messages.length === 0 && (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                No messages yet. Start chatting!
              </div>
            )}
            <div className="space-y-4">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  isSent={msg.userId === userId || msg.from === userId}
                  highlight={msg.id === highlightId}
                />
              ))}
            </div>
            <div ref={bottomRef} />
          </div>
        </main>

        {/* USER LIST SIDE PANEL */}
        <UserList users={roomUsers} currentUsername={username} />
      </div>

      {/* INPUT */}
      <MessageInput />
    </div>
  );
}
