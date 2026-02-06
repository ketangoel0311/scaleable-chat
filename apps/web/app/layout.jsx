import { SocketProvider } from '../context/SocketProvider';
import './globals.css';

export const metadata = {
  title: 'Scaleable Chat',
  description: 'Real-time chat application with WebSocket & Redis Pub/Sub',
};

/**
 * Root layout component
 */
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-gray-900 text-white">
        <SocketProvider>{children}</SocketProvider>
      </body>
    </html>
  );
}
