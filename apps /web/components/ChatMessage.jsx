export const ChatMessage = ({ message, isSent, highlight }) => {
  const displayUsername = message.username || 'Unknown';

  return (
    <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} items-end gap-2`}>
      {!isSent && (
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold text-gray-700 flex-shrink-0">
          {displayUsername.charAt(0).toUpperCase()}
        </div>
      )}
      <div className={`flex flex-col ${isSent ? 'items-end' : 'items-start'} max-w-xs`}>
        {!isSent && <span className="text-xs text-gray-600 mb-1 px-1">{displayUsername}</span>}
        <div
          className={`
            px-4 py-2 rounded-2xl transition-all duration-300
            ${
              isSent
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                : 'bg-gray-800 text-white'
            }
            ${highlight ? 'ring-2 ring-emerald-400 scale-105' : ''}
          `}
        >
          <p className="text-sm leading-relaxed break-words">{message.text}</p>

          <div className={`mt-1 text-xs opacity-70 ${isSent ? 'text-right' : 'text-left'}`}>
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      </div>
      {isSent && (
        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
          {displayUsername.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
};
