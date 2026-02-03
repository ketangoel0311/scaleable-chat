// export const ChatMessage = ({ message, isSent, highlight }) => {
//   return (
//     <div className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
//       <div
//         className={`
//           max-w-[65%]
//           px-5 py-3
//           rounded-2xl
//           bg-[#020617]/85
//           text-slate-100
//           border border-white/10
//           backdrop-blur
//           shadow-lg
//           transition-all duration-300
//           ${
//             highlight
//               ? 'ring-2 ring-cyan-400 scale-[1.02] shadow-[0_0_30px_rgba(34,211,238,0.6)]'
//               : ''
//           }
//         `}
//       >
//         <p className="text-sm leading-relaxed break-words">{message.text}</p>

//         <div className="mt-2 text-[10px] text-cyan-300/80 text-right">
//           {new Date(message.timestamp).toLocaleTimeString([], {
//             hour: '2-digit',
//             minute: '2-digit',
//           })}
//         </div>
//       </div>
//     </div>
//   );
// };
export const ChatMessage = ({ message, isSent, highlight }) => {
  return (
    <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`
          max-w-[65%]
          px-5 py-3
          rounded-2xl
          bg-[#020617]/90
          text-slate-100
          border border-white/10
          backdrop-blur
          shadow-lg
          transition-all duration-300
          ${
            highlight
              ? 'ring-2 ring-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.6)] scale-[1.02]'
              : ''
          }
        `}
      >
        <p className="text-sm leading-relaxed break-words">{message.text}</p>

        <div className="mt-2 text-[10px] text-cyan-300/70 text-right">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
};
