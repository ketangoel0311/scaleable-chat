# UI Components Documentation

Complete reference for all frontend components in the redesigned chat application.

---

## Component Overview

```
App Layout (page.jsx)
├── Header
│   ├── Title & Description
│   └── ConnectionStatus Component
├── Messages Container
│   └── ChatMessage Components (mapped)
└── Footer
    ├── MessageInput Component
    └── Status Text
```

---

## Components

### 1. ConnectionStatus

Displays real-time connection status to the server.

**Location:** `apps/web/components/ConnectionStatus.jsx`

**Props:**
```javascript
{
  isConnected: boolean  // true = connected, false = disconnected
}
```

**Example Usage:**
```javascript
import { ConnectionStatus } from '../components';

export default function Header() {
  const { isConnected } = useSocket();
  return <ConnectionStatus isConnected={isConnected} />;
}
```

**Features:**
- ✅ Green pulsing indicator when connected
- ✅ Red indicator when disconnected
- ✅ Clear status text
- ✅ Smooth animations

**Styling:**
```javascript
// Connected
<div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
<span className="text-green-400">Connected</span>

// Disconnected
<div className="w-3 h-3 rounded-full bg-red-500" />
<span className="text-red-400">Disconnected</span>
```

**Responsive:** ✅ Scales on mobile and desktop

---

### 2. ChatMessage

Displays individual message bubbles with timestamps.

**Location:** `apps/web/components/ChatMessage.jsx`

**Props:**
```javascript
{
  message: {
    id: number,           // Unique ID
    text: string,         // Message content
    timestamp: number,    // Unix timestamp
    from: string          // Sender ID
  },
  isSent: boolean        // true = sent by user, false = received
}
```

**Example Usage:**
```javascript
import { ChatMessage } from '../components';

export default function MessageList({ messages }) {
  return messages.map((msg) => (
    <ChatMessage
      key={msg.id}
      message={msg}
      isSent={msg.from === 'self'}
    />
  ));
}
```

**Features:**
- ✅ Sent messages: Blue, right-aligned
- ✅ Received messages: Gray, left-aligned
- ✅ Timestamps on each message
- ✅ Smooth fade-in animation
- ✅ Text wrapping for long messages
- ✅ Responsive width (max-w-xs on mobile)

**Styling:**

**Sent Message:**
```javascript
<div className="flex justify-end mb-3 animate-fade-in">
  <div className="max-w-xs px-4 py-2 rounded-lg bg-blue-500 text-white rounded-br-none">
    <p className="text-sm break-words">{message.text}</p>
    <p className="text-xs mt-1 text-blue-100">{time}</p>
  </div>
</div>
```

**Received Message:**
```javascript
<div className="flex justify-start mb-3 animate-fade-in">
  <div className="max-w-xs px-4 py-2 rounded-lg bg-gray-700 text-gray-100 rounded-bl-none">
    <p className="text-sm break-words">{message.text}</p>
    <p className="text-xs mt-1 text-gray-400">{time}</p>
  </div>
</div>
```

**Animations:**
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

animation: fadeIn 0.3s ease-in;
```

**Time Format:** `HH:MM AM/PM` (12-hour format)

---

### 3. MessageInput

Input area with textarea and send button.

**Location:** `apps/web/components/MessageInput.jsx`

**Props:** None (uses SocketProvider context)

**Example Usage:**
```javascript
import { MessageInput } from '../components';

export default function ChatPage() {
  return (
    <div className="flex flex-col h-screen">
      {/* Messages... */}
      <MessageInput />
    </div>
  );
}
```

**Features:**
- ✅ Textarea with auto-expand
- ✅ Send button with loading state
- ✅ Keyboard shortcuts
- ✅ Placeholder changes based on connection
- ✅ Disabled when disconnected
- ✅ Loading spinner while sending
- ✅ Input validation (no empty messages)

**Keyboard Shortcuts:**
| Key | Action |
|-----|--------|
| `Enter` | Send message |
| `Shift+Enter` | New line |
| `Ctrl+Enter` | Send on custom config |

**Example Code:**
```javascript
const handleKeyDown = (e) => {
  // Send on Enter (not Shift+Enter)
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
};
```

**Styling:**

**Textarea:**
```javascript
<textarea
  className="flex-1 bg-gray-700 text-white placeholder-gray-400 
    rounded-lg px-4 py-2 resize-none
    focus:outline-none focus:ring-2 focus:ring-blue-500
    disabled:opacity-50 disabled:cursor-not-allowed
    max-h-24"
  rows="1"
/>
```

**Send Button:**
```javascript
<button
  className="px-6 py-2 bg-blue-500 text-white font-semibold 
    rounded-lg hover:bg-blue-600 transition-colors
    disabled:opacity-50 disabled:cursor-not-allowed
    flex items-center gap-2"
>
  {isSubmitting ? '⟳' : '→'} Send
</button>
```

**States:**
- ✅ Normal: Blue button
- ✅ Hover: Darker blue
- ✅ Loading: Shows spinner
- ✅ Disabled: Grayed out, not clickable

---

## Socket Provider Hook

**Location:** `apps/web/context/SocketProvider.jsx`

### `useSocket()`

Returns socket context with methods and state.

**Returns:**
```javascript
{
  socket: Socket | null,        // Socket.IO instance
  sendMessage: (msg: string) => void,  // Send message function
  messages: Message[],           // Array of messages
  isConnected: boolean,          // Connection status
  isTyping: boolean,             // Typing indicator
  setIsTyping: (bool) => void    // Set typing status
}
```

**Example Usage:**
```javascript
import { useSocket } from '../context/SocketProvider';

export default function ChatComponent() {
  const { sendMessage, messages, isConnected } = useSocket();

  const handleSend = (text) => {
    if (isConnected) {
      sendMessage(text);
    }
  };

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>{msg.text}</div>
      ))}
      <button onClick={() => handleSend('Hello!')}>
        Send
      </button>
    </div>
  );
}
```

**Throw Pattern:**
The hook will throw an error if used outside `SocketProvider`:
```javascript
const state = useContext(SocketContext);
if (!state) {
  throw new Error('useSocket must be used within SocketProvider');
}
```

---

## Page Layout (page.jsx)

Main chat page structure.

**Location:** `apps/web/app/page.jsx`

**Structure:**
```javascript
export default function Page() {
  const { messages, isConnected } = useSocket();

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Header with title and status */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <h1>Scaleable Chat</h1>
        <ConnectionStatus isConnected={isConnected} />
      </div>

      {/* Messages area with auto-scroll */}
      <div className="flex-1 overflow-y-auto p-6 space-y-2">
        {messages.length === 0 ? (
          <div>No messages yet</div>
        ) : (
          messages.map(msg => (
            <ChatMessage
              key={msg.id}
              message={msg}
              isSent={msg.from === 'self'}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <MessageInput />

      {/* Footer status */}
      <div className="bg-gray-800 border-t border-gray-700 px-6 py-3">
        {isConnected ? 'Connected' : 'Disconnected'}
      </div>
    </div>
  );
}
```

**Features:**
- ✅ Full viewport height (`h-screen`)
- ✅ Flexbox layout for responsive design
- ✅ Auto-scroll on new messages
- ✅ Connection status indicator
- ✅ Empty state messaging
- ✅ Footer with real-time status

---

## Styling System

### Color Palette

**Grays (Background):**
```javascript
bg-gray-900   // Dark background (#111827)
bg-gray-800   // Slightly lighter (#1f2937)
bg-gray-700   // Message input area (#374151)
```

**Accents:**
```javascript
bg-blue-500   // Primary button & sent messages (#3b82f6)
bg-blue-600   // Button hover (#2563eb)
text-green-400  // Connected status (#4ade80)
text-red-400    // Disconnected status (#f87171)
```

**Text:**
```javascript
text-white      // Primary text
text-gray-100   // Secondary text
text-gray-400   // Tertiary/helper text
```

### Tailwind Utilities Used

**Spacing:**
```javascript
p-4        // Padding
px-4 py-2  // Horizontal & vertical
mb-3       // Margin bottom
gap-2      // Gap between flexbox items
```

**Layout:**
```javascript
flex flex-col     // Vertical flexbox
flex items-center // Centered items
justify-start     // Left align
justify-end       // Right align
h-screen          // Full viewport height
w-full            // Full width
```

**Responsive:**
```javascript
max-w-xs          // Max width for mobile
max-w-4xl         // Max width for desktop
mx-auto           // Center on desktop
```

**Effects:**
```javascript
rounded-lg          // Rounded corners
rounded-br-none     // Remove bottom-right radius
shadow-lg           // Drop shadow
border border-gray-700  // Borders
animate-pulse       // Pulsing animation
animate-fade-in     // Fade-in animation
```

**Interactive:**
```javascript
hover:bg-blue-600   // Hover state
transition-colors   // Smooth color transition
disabled:opacity-50 // Disabled state
focus:ring-2        // Focus ring
```

---

## Responsive Design

### Breakpoints

**Mobile First:**
- **Default (Mobile):** <= 640px
- **Tablet:** 641px - 1024px
- **Desktop:** > 1024px

**Component Responsiveness:**

**ChatMessage:**
```javascript
<div className="max-w-xs px-4 py-2 rounded-lg">
  // max-w-xs = 20rem (320px)
  // Wraps nicely on mobile
```

**MessageInput:**
```javascript
<div className="flex gap-2 p-4">
  // Flex direction is row by default
  // Wraps naturally on small screens
```

**Header:**
```javascript
<div className="max-w-4xl mx-auto flex items-center justify-between">
  // max-w-4xl = 56rem (896px)
  // Centers content on large screens
  // Full width on mobile
```

### Mobile Optimizations
- ✅ Touch-friendly button sizes (44px+)
- ✅ Readable font sizes
- ✅ Proper spacing for touch
- ✅ Scrollable message area
- ✅ Expandable textarea

---

## Dark Mode

Fully implemented dark theme using Tailwind:

```javascript
// Background
bg-gray-900     // #111827
bg-gray-800     // #1f2937
bg-gray-700     // #374151

// Text
text-white      // #ffffff
text-gray-100   // #f3f4f6
text-gray-400   // #9ca3af

// Accents
bg-blue-500     // #3b82f6
bg-green-500    // #10b981
bg-red-500      // #ef4444
```

No light mode CSS (could be added with Tailwind dark mode).

---

## Animations

### Tailwind Animations

**Fade In:**
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
animation: fadeIn 0.3s ease-in;
```

Used on: ChatMessage components

**Pulse:**
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .5; }
}
animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
```

Used on: Connection status indicator

**Transition:**
```css
transition-colors  // Color changes
transition: all 0.3s ease-in-out;  // All properties
```

Used on: Button hover effects

---

## Accessibility

### ARIA & Semantics

```javascript
<button aria-label="Send message">Send</button>
<textarea placeholder="Type a message..." />
<div role="status" aria-live="polite">Connected</div>
```

### Keyboard Navigation
- ✅ All buttons focusable
- ✅ Tab through inputs
- ✅ Enter to send
- ✅ Shift+Enter for newline

### Color Contrast
- ✅ White on blue (AA rating)
- ✅ Gray on darker gray (AA rating)
- ✅ Green indicator for color-blind users (text + icon)

### Mobile Accessibility
- ✅ Touch target sizes (44px+)
- ✅ Readable text (16px+)
- ✅ Proper spacing

---

## Customization

### Change Colors

**globals.css:**
```css
:root {
  --color-primary: #3b82f6;  /* Blue */
  --color-success: #10b981;  /* Green */
  --color-danger: #ef4444;   /* Red */
}
```

**tailwind.config.js:**
```javascript
extend: {
  colors: {
    'primary': '#3b82f6',
    'secondary': '#1e293b',
  }
}
```

### Change Fonts

**tailwind.config.js:**
```javascript
extend: {
  fontFamily: {
    'sans': ['Inter', 'sans-serif'],
  }
}
```

**globals.css:**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');
```

### Change Animations

**tailwind.config.js:**
```javascript
keyframes: {
  'fade-in': {
    from: { opacity: '0' },
    to: { opacity: '1' },
  },
}
```

---

## Testing Components

### Manual Testing Checklist

```javascript
// ChatMessage
✅ Sent message right-aligned
✅ Received message left-aligned
✅ Timestamp displays correctly
✅ Text wraps on long messages
✅ Fade-in animation works

// MessageInput
✅ Focus state visible
✅ Enter to send works
✅ Shift+Enter for newline works
✅ Button disabled when disconnected
✅ Loading spinner shows

// ConnectionStatus
✅ Green when connected
✅ Red when disconnected
✅ Pulse animation on connected
✅ Text updates correctly

// Layout
✅ Responsive on mobile
✅ Auto-scroll works
✅ Empty state shows
✅ Scrollable message area
✅ Footer always visible
```

---

## Performance Tips

1. **Message List:** Consider virtualization for 1000+ messages
2. **Images:** Add image support with lazy loading
3. **Search:** Add searchable message history
4. **Memoization:** Use `React.memo()` for ChatMessage if re-rendering is slow

---

## Future Enhancements

- 🔄 Typing indicators (partially implemented)
- 👥 User avatars
- 🔗 Link previews
- 📎 File uploads
- 🎨 Message reactions
- 🔍 Message search
- 📌 Pinned messages
- 🧵 Thread support

---

