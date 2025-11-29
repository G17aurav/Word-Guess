import { io } from 'socket.io-client';

export const socket = io('https://word-guess-t99q.onrender.com/', {
  transports: ['websocket', 'polling'],
});

// optional: log immediately
socket.on('connect', () => {
  console.log('🔌 Connected to socket server as', socket.id);
});

socket.on('connect_error', (err) => {
  console.error('⚠️ Socket connect_error:', err.message);
});
