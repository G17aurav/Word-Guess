const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const words = ['guitar', 'bags'] // array of strings

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// roomCode -> roomState
// roomState: { players, strokes, hostId, gameStarted, drawerId, currentWord, guessedPlayers }
const rooms = {};

// Simple room code generator (e.g. "k3f9a2")
function generateRoomCode() {
  const code = Math.random().toString(36).substring(2, 8);
  if (!rooms[code]) return code;
  return generateRoomCode();
}

function getRandomWord() {
  const idx = Math.floor(Math.random() * words.length);
  return words[idx];
}

// Start a drawing round in a room: choose drawer + word, reset guessedPlayers
function startRound(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;

  const playerIds = Object.keys(room.players);
  if (playerIds.length === 0) return;

  // For now: pick a random drawer each time
  const drawerId = playerIds[Math.floor(Math.random() * playerIds.length)];
  const word = getRandomWord();

  room.drawerId = drawerId;
  room.currentWord = word;
  room.guessedPlayers = {}; // socketId -> true

  console.log('Starting round in room', roomCode, 'drawer =', drawerId, 'word =', word);

  // Notify everyone who is drawing, and send only the length to guessers
  io.to(roomCode).emit('round_started', {
    drawerId,
    wordLength: word.length,
  });

  // Send the actual word ONLY to the drawer
  io.to(drawerId).emit('your_word', { word });
}

io.on('connection', (socket) => {
  console.log('New socket connected:', socket.id);

  // Optional: log all events for debugging
  socket.onAny((event, ...args) => {
    console.log('Event from', socket.id, '->', event, args);
  });

  // Create a new room and make this socket the host
  socket.on('create_room', ({ name }) => {
    console.log('create_room received from', socket.id, 'name =', name);

    const trimmedName = (name || '').trim();
    if (!trimmedName) {
      console.log('Name missing, sending room_error');
      socket.emit('room_error', { message: 'Name is required.' });
      return;
    }

    const roomCode = generateRoomCode();
    rooms[roomCode] = {
      players: {},           // socketId -> { name, score }
      strokes: [],
      hostId: socket.id,
      gameStarted: false,
      drawerId: null,
      currentWord: null,
      guessedPlayers: {},    // socketId -> true
    };

    socket.join(roomCode);
    socket.data.roomCode = roomCode;
    socket.data.name = trimmedName;

    rooms[roomCode].players[socket.id] = { name: trimmedName, score: 0 };

    console.log('Room created:', roomCode, 'by', trimmedName);

    socket.emit('room_created', {
      roomCode,
      players: rooms[roomCode].players,
      hostId: rooms[roomCode].hostId,
    });

    io.to(roomCode).emit('players_update', {
      players: rooms[roomCode].players,
      hostId: rooms[roomCode].hostId,
    });
  });

  // Join an existing room
  socket.on('join_room', ({ name, roomCode }) => {
    console.log('join_room received from', socket.id, 'name =', name, 'roomCode =', roomCode);

    const trimmedName = (name || '').trim();
    const trimmedCode = (roomCode || '').trim().toLowerCase();

    if (!trimmedName) {
      socket.emit('room_error', { message: 'Name is required.' });
      return;
    }

    if (!trimmedCode || !rooms[trimmedCode]) {
      socket.emit('room_error', { message: 'Room not found.' });
      return;
    }

    const room = rooms[trimmedCode];

    socket.join(trimmedCode);
    socket.data.roomCode = trimmedCode;
    socket.data.name = trimmedName;

    // new player starts at score 0
    room.players[socket.id] = { name: trimmedName, score: 0 };

    console.log('Player', trimmedName, 'joined room', trimmedCode);

    socket.emit('room_joined', {
      roomCode: trimmedCode,
      players: room.players,
      hostId: room.hostId,
      gameStarted: room.gameStarted,
      drawerId: room.drawerId || null,
      wordLength: room.currentWord ? room.currentWord.length : 0,
    });

    io.to(trimmedCode).emit('players_update', {
      players: room.players,
      hostId: room.hostId,
    });

    // Send existing strokes so the new player sees the current drawing
    socket.emit('init_strokes', room.strokes);
  });

  // Host starts the game
  socket.on('start_game', () => {
    const roomCode = socket.data.roomCode;
    if (!roomCode || !rooms[roomCode]) return;

    const room = rooms[roomCode];

    // Only host can start the game
    if (room.hostId !== socket.id) {
      console.log('start_game denied for', socket.id, 'not host of', roomCode);
      return;
    }

    room.gameStarted = true;
    console.log('Game started in room', roomCode);

    // Let clients switch UI to game screen
    io.to(roomCode).emit('game_started');

    // Start first round (choose drawer + word)
    startRound(roomCode);
  });

  // Drawing events (per room)
  socket.on('draw', (data) => {
    const roomCode = socket.data.roomCode;
    if (!roomCode || !rooms[roomCode]) return;

    const room = rooms[roomCode];
    room.strokes.push(data);

    socket.to(roomCode).emit('draw', data);
  });

  // Clear board (per room)
  socket.on('clear', () => {
    const roomCode = socket.data.roomCode;
    if (!roomCode || !rooms[roomCode]) return;

    rooms[roomCode].strokes = [];
    io.to(roomCode).emit('clear');
  });

  // Chat + guessing (per room) with scoring
  socket.on('chat_message', ({ message }) => {
    const roomCode = socket.data.roomCode;
    if (!roomCode || !rooms[roomCode]) return;

    const room = rooms[roomCode];
    const player = room.players[socket.id];
    if (!player) return;

    const name = player.name || 'Anonymous';
    const trimmed = (message || '').trim();
    if (!trimmed) return;

    const hasWord = !!room.currentWord;
    const isDrawer = socket.id === room.drawerId;
    const alreadyGuessed = room.guessedPlayers[socket.id];

    const isCorrect =
      hasWord &&
      !isDrawer &&
      !alreadyGuessed &&
      trimmed.toLowerCase() === room.currentWord.toLowerCase();

    if (isCorrect) {
      // mark this player as having guessed correctly
      room.guessedPlayers[socket.id] = true;

      // award points
      if (typeof player.score !== 'number') player.score = 0;
      player.score += 10;

      console.log(
        'Correct guess in room',
        roomCode,
        'by',
        socket.id,
        '(' + name + ')',
        'new score =',
        player.score
      );

      // notify everyone that this player guessed correctly
      io.to(roomCode).emit('correct_guess', {
        playerId: socket.id,
        name,
        score: player.score,
      });

      // update everyone’s score displays
      io.to(roomCode).emit('players_update', {
        players: room.players,
        hostId: room.hostId,
      });

      return;
    }

    // Normal chat message (not a correct guess)
    io.to(roomCode).emit('chat_message', { name, message: trimmed });
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);

    const roomCode = socket.data.roomCode;
    const name = socket.data.name;

    if (roomCode && rooms[roomCode]) {
      const room = rooms[roomCode];
      delete room.players[socket.id];

      // If host left, pick a new host if any players remain
      if (room.hostId === socket.id) {
        const remainingIds = Object.keys(room.players);
        room.hostId = remainingIds.length > 0 ? remainingIds[0] : null;
      }

      // If drawer left, clear drawer/word (you could also auto start a new round)
      if (room.drawerId === socket.id) {
        room.drawerId = null;
        room.currentWord = null;
        room.guessedPlayers = {};
      }

      if (Object.keys(room.players).length > 0) {
        io.to(roomCode).emit('players_update', {
          players: room.players,
          hostId: room.hostId,
        });
      } else {
        console.log('Deleting empty room:', roomCode);
        delete rooms[roomCode];
      }
    }
  });
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log('Server running on http://localhost:' + PORT);
});
