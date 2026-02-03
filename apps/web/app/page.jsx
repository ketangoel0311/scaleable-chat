'use client';

import { useEffect, useRef, useState } from 'react';
import { useSocket } from '../context/SocketProvider';
import { ChatMessage, MessageInput, ConnectionStatus } from '../components';

export default function Page() {
  const { messages, isConnected } = useSocket();
  const bottomRef = useRef(null);
  const [highlightId, setHighlightId] = useState(null);

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

  return (
    <div
      className="
        relative h-screen flex flex-col text-slate-100
        bg-gradient-to-br
        from-indigo-500/20
        via-cyan-400/15
        to-purple-500/20
      "
    >
      {/* Aurora glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-indigo-500/25 blur-[160px]" />
        <div className="absolute bottom-0 right-1/3 w-[700px] h-[700px] bg-cyan-400/25 blur-[160px]" />
      </div>

      {/* Header */}
      <header
        className="
        relative h-16 px-6 flex items-center
        bg-[#020617]/80 backdrop-blur
        border-b border-white/10
      "
      >
        <div className="flex-1">
          <h1 className="text-sm font-semibold tracking-wide">Scalable Chat</h1>
          <p className="text-xs text-slate-400">Real-time • WebSockets • Redis</p>
        </div>
        <ConnectionStatus isConnected={isConnected} />
      </header>

      {/* Messages */}
      <main className="relative flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="h-[60vh] flex items-center justify-center text-slate-400 text-sm">
              No messages yet
            </div>
          )}

          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              isSent={msg.from === 'self'}
              highlight={msg.id === highlightId}
            />
          ))}

          <div ref={bottomRef} />
        </div>
      </main>

      {/* Input */}
      <MessageInput />

      {/* Footer */}
      <footer
        className="
        h-10 flex items-center justify-center
        text-[11px] text-slate-400
        border-t border-white/10
        bg-[#020617]/70
        backdrop-blur
      "
      >
        {isConnected ? 'Connected • Real-time sync active' : 'Reconnecting…'}
      </footer>
    </div>
  );
}
