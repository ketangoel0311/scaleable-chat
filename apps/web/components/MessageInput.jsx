'use client';

import { useState } from 'react';
import { useSocket } from '../context/SocketProvider';

export const MessageInput = () => {
  const { sendMessage, isConnected } = useSocket();
  const [value, setValue] = useState('');

  const send = () => {
    if (!value.trim()) return;
    sendMessage(value);
    setValue('');
  };

  return (
    <div
      className="
        relative
        bg-[#020617]/80
        backdrop-blur
        border-t border-white/10
        px-6 py-4
      "
    >
      <div className="max-w-3xl mx-auto flex gap-3">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          disabled={!isConnected}
          placeholder={isConnected ? 'Type a message…' : 'Connecting…'}
          className="
            flex-1
            bg-[#020617]
            border border-white/15
            rounded-xl
            px-4 py-3
            text-sm
            text-slate-100
            placeholder-slate-400
            focus:outline-none
            focus:ring-2
            focus:ring-cyan-400
            disabled:opacity-50
          "
        />

        <button
          onClick={send}
          disabled={!value.trim() || !isConnected}
          className="
            px-6 py-3
            rounded-xl
            bg-gradient-to-r from-cyan-500 to-indigo-500
            text-white
            text-sm font-semibold
            hover:opacity-90
            transition
            disabled:opacity-40
          "
        >
          Send
        </button>
      </div>
    </div>
  );
};
