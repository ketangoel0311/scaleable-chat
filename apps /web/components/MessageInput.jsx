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
    <div className="bg-white border-t border-emerald-200/50 px-6 py-4">
      <div className="max-w-4xl mx-auto flex gap-3">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          disabled={!isConnected}
          placeholder={isConnected ? 'Type a message…' : 'Connecting…'}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
        />
        <button
          onClick={send}
          disabled={!value.trim() || !isConnected}
          className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-lg hover:from-emerald-700 hover:to-teal-700 transition disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
};
