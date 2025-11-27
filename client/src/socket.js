import { io } from 'socket.io-client';

export const socket = io('http://localhost:4000', {
  transports: ['websocket', 'polling'],
});

// optional: log immediately
socket.on('connect', () => {
  console.log('🔌 Connected to socket server as', socket.id);
});

socket.on('connect_error', (err) => {
  console.error('⚠️ Socket connect_error:', err.message);
});
