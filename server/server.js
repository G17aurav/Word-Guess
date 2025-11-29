const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const words = require('./beginnerWords');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// roomCode -> roomState
// roomState: {
//   players, strokes, hostId, gameStarted,
//   drawerId, currentWord, guessedPlayers,
//   turnOrder, drawerIndex,
//   roundEndTime, roundTimeout,
//   roundNumber, drawnThisRound
// }
const rooms = {};

const ROUND_MS = 90_000;
const MAX_ROUNDS = 3;

const maskWord = (word = '') =>
  word
    .split('')
    .map((ch) => (ch === ' ' ? ' ' : '_'))
    .join('');

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

function getRandomWords(count = 3) {
  const copy = [...words];
  const picks = [];
  while (copy.length && picks.length < count) {
    const idx = Math.floor(Math.random() * copy.length);
    picks.push(copy.splice(idx, 1)[0]);
  }
  return picks;
}


function endRound(roomCode, { immediateNext = false } = {}) {
  const room = rooms[roomCode];
  if (!room) return;

  console.log('Ending round in room', roomCode, 'word =', room.currentWord);

  const playerIds = Object.keys(room.players);
  room.turnOrder = room.turnOrder.filter((id) => room.players[id]);
  if (room.turnOrder.length === 0 && playerIds.length > 0) {
    room.turnOrder = playerIds.slice();
    room.drawerIndex = 0;
  }

  // clear any existing timeout handle
  if (room.roundTimeout) {
    clearTimeout(room.roundTimeout);
    room.roundTimeout = null;
  }

  io.to(roomCode).emit('round_ended', {
    players: room.players,
    word: room.currentWord,
    roundComplete:
      room.turnOrder.length > 0 &&
      room.turnOrder.every((id) => room.drawnThisRound && room.drawnThisRound[id]),
    roundNumber: room.roundNumber,
  });

  // reset per-round state
  room.drawerId = null;
  room.currentWord = null;
  room.guessedPlayers = {};
  room.roundEndTime = null;
  room.wordOptions = [];
  room.strokes = [];
  io.to(roomCode).emit('clear');
  room.wordMask = '';

  // If everyone has drawn, advance to next round cycle
  const allDrew =
    room.turnOrder.length > 0 &&
    room.turnOrder.every((id) => room.drawnThisRound && room.drawnThisRound[id]);
  const reachedMaxRounds = allDrew && room.roundNumber >= MAX_ROUNDS;
  if (allDrew) {
    room.drawnThisRound = {};
    room.roundNumber += 1;
  }

  // If game is over, announce and stop scheduling new rounds
  if (reachedMaxRounds) {
    room.gameStarted = false;
    io.to(roomCode).emit('game_over', {
      players: room.players,
      roundsPlayed: MAX_ROUNDS,
    });
    return;
  }

  if (room.gameStarted && Object.keys(room.players).length > 0) {
    const delayMs = immediateNext ? 0 : 5000;
    setTimeout(() => {
      startRound(roomCode);
    }, delayMs);
  }
}

// Start a drawing round in a room
function startRound(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;

  const playerIds = Object.keys(room.players);
  if (playerIds.length === 0) return;

  // Keep turnOrder in sync with players
  room.turnOrder = room.turnOrder.filter((id) => room.players[id]);
  if (room.turnOrder.length === 0) {
    room.turnOrder = playerIds.slice();
    room.drawerIndex = 0;
  }
  if (!room.drawnThisRound) room.drawnThisRound = {};
  if (typeof room.roundNumber !== 'number') room.roundNumber = 1;

  // If everyone has drawn in this round, reset for the next round
  const everyoneDrew = room.turnOrder.every((id) => room.drawnThisRound[id]);
  if (everyoneDrew) {
    room.drawnThisRound = {};
    room.roundNumber += 1;
  }

  if (room.drawerIndex >= room.turnOrder.length) room.drawerIndex = 0;

  // Pick the next player who has not drawn in this round
  let drawerId = null;
  for (let i = 0; i < room.turnOrder.length; i++) {
    const candidate = room.turnOrder[room.drawerIndex];
    room.drawerIndex = (room.drawerIndex + 1) % room.turnOrder.length;
    if (!room.drawnThisRound[candidate]) {
      drawerId = candidate;
      break;
    }
  }

  // If we somehow couldn't find a drawer, start a fresh round
  if (!drawerId) {
    room.drawnThisRound = {};
    room.roundNumber += 1;
    room.drawerIndex = 0;
    drawerId = room.turnOrder[0];
  }

  room.drawerId = drawerId;
  room.currentWord = null;
  room.wordOptions = getRandomWords(3);
  room.guessedPlayers = {};
  room.roundEndTime = null;
  room.wordMask = '';
  if (room.roundTimeout) {
    clearTimeout(room.roundTimeout);
    room.roundTimeout = null;
  }

  room.drawnThisRound[drawerId] = true;
  const turnNumber = Object.keys(room.drawnThisRound).length;
  const totalTurns = room.turnOrder.length;

  console.log(
    'Starting round in room',
    roomCode,
    'round =',
    room.roundNumber,
    'turn =',
    turnNumber + '/' + totalTurns,
    'drawer =',
    drawerId
  );

  // Notify everyone who is drawing, and send only the length + end time
  io.to(roomCode).emit('round_started', {
    drawerId,
    wordLength: 0,
    roundEndTime: null,
    roundNumber: room.roundNumber,
    turnNumber,
    totalTurns,
  });

  // Send word options ONLY to the drawer
  io.to(drawerId).emit('word_options', { options: room.wordOptions });
}

io.on('connection', (socket) => {
  console.log('New socket connected:', socket.id);

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
      players: {},          
      strokes: [],
      hostId: socket.id,
      gameStarted: false,
      drawerId: null,
      currentWord: null,
      guessedPlayers: {},  
      turnOrder: [],
      drawerIndex: 0,
      roundEndTime: null,
      roundTimeout: null,
      wordOptions: [],
      roundNumber: 1,
      drawnThisRound: {},
      wordMask: '',
    };

    const room = rooms[roomCode];

    socket.join(roomCode);
    socket.data.roomCode = roomCode;
    socket.data.name = trimmedName;

    room.players[socket.id] = { name: trimmedName, score: 0 };
    room.turnOrder.push(socket.id);

    console.log('Room created:', roomCode, 'by', trimmedName);

    socket.emit('room_created', {
      roomCode,
      players: room.players,
      hostId: room.hostId,
    });

    io.to(roomCode).emit('players_update', {
      players: room.players,
      hostId: room.hostId,
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
    room.turnOrder.push(socket.id);

    console.log('Player', trimmedName, 'joined room', trimmedCode);

    socket.emit('room_joined', {
      roomCode: trimmedCode,
      players: room.players,
      hostId: room.hostId,
      gameStarted: room.gameStarted,
      drawerId: room.drawerId || null,
      wordLength: room.currentWord ? room.currentWord.length : 0,
      wordMask: room.wordMask || '',
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

    // Start first round
    startRound(roomCode);
  });

  // Drawer picks one word from the provided options to start the timer
  socket.on('select_word', ({ word }) => {
    const roomCode = socket.data.roomCode;
    if (!roomCode || !rooms[roomCode]) return;

    const room = rooms[roomCode];
    if (socket.id !== room.drawerId) return;
    if (!room.wordOptions || room.wordOptions.length === 0) return;
    if (room.currentWord) return;

    const normalizedChoice = (word || '').toLowerCase();
    const index = room.wordOptions.findIndex(
      (w) => (w || '').toLowerCase() === normalizedChoice
    );
    if (index === -1) return;

    const chosenWord = room.wordOptions[index];
    room.currentWord = chosenWord;
    room.wordOptions = [];

    const endTime = Date.now() + ROUND_MS;
    room.roundEndTime = endTime;

    if (room.roundTimeout) {
      clearTimeout(room.roundTimeout);
    }
    room.roundTimeout = setTimeout(() => {
      endRound(roomCode);
    }, ROUND_MS);

    console.log(
      'Word selected in room',
      roomCode,
      'drawer =',
      socket.id,
      'word =',
      chosenWord,
      'endsAt =',
      endTime
    );

    room.wordMask = maskWord(chosenWord);

    io.to(roomCode).emit('word_selected', {
      drawerId: room.drawerId,
      wordLength: chosenWord.length,
      roundEndTime: endTime,
      wordMask: room.wordMask,
    });

    // Send the actual word ONLY to the drawer
    io.to(socket.id).emit('your_word', { word: chosenWord });
  });

  socket.on('draw', (data) => {
    const roomCode = socket.data.roomCode;
    if (!roomCode || !rooms[roomCode]) return;

    const room = rooms[roomCode];
    if (socket.id !== room.drawerId) return;
    room.strokes.push(data);

    socket.to(roomCode).emit('draw', data);
  });

  socket.on('clear', () => {
    const roomCode = socket.data.roomCode;
    if (!roomCode || !rooms[roomCode]) return;

    const room = rooms[roomCode];
    if (socket.id !== room.drawerId) return;
    room.strokes = [];
    io.to(roomCode).emit('clear');
  });

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
    if (isDrawer) return;

    const isCorrect =
      hasWord &&
      !isDrawer &&
      !alreadyGuessed &&
      trimmed.toLowerCase() === room.currentWord.toLowerCase();

    if (isCorrect) {
      room.guessedPlayers[socket.id] = true;

      // award points scaled by remaining time
      const now = Date.now();
      const timeLeftMs = room.roundEndTime
        ? Math.max(0, room.roundEndTime - now)
        : 0;
      const timeRatio = Math.min(1, timeLeftMs / ROUND_MS);
      const pointsAwarded = Math.max(5, Math.round(100 * timeRatio));

      if (typeof player.score !== 'number') player.score = 0;
      player.score += pointsAwarded;

      console.log(
        'Correct guess in room',
        roomCode,
        'by',
        socket.id,
        '(' + name + ')',
        'awarded',
        pointsAwarded,
        'new score =',
        player.score
      );

      // notify everyone that this player guessed correctly
      io.to(roomCode).emit('correct_guess', {
        playerId: socket.id,
        name,
        score: player.score,
        pointsAwarded,
      });

      // update everyone’s score displays
      io.to(roomCode).emit('players_update', {
        players: room.players,
        hostId: room.hostId,
      });

      // If everyone has guessed correctly, end the round early
      const totalGuessers = Object.keys(room.players).filter(
        (id) => id !== room.drawerId
      ).length;
      const correctGuessers = Object.keys(room.guessedPlayers).length;
      if (totalGuessers > 0 && correctGuessers >= totalGuessers) {
        if (room.roundTimeout) {
          clearTimeout(room.roundTimeout);
          room.roundTimeout = null;
        }
        endRound(roomCode, { immediateNext: true });
      }

      return;
    }

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
      if (room.drawnThisRound) {
        delete room.drawnThisRound[socket.id];
      }

      room.turnOrder = room.turnOrder.filter((id) => id !== socket.id);
      if (room.drawerId === socket.id) {
        room.drawerId = null;
        room.currentWord = null;
        room.guessedPlayers = {};
        room.wordOptions = [];
      }

      // If host left, pick a new host if any players remain
      if (room.hostId === socket.id) {
        const remainingIds = Object.keys(room.players);
        room.hostId = remainingIds.length > 0 ? remainingIds[0] : null;
      }

      if (Object.keys(room.players).length > 0) {
        io.to(roomCode).emit('players_update', {
          players: room.players,
          hostId: room.hostId,
        });
      } else {
        console.log('Deleting empty room:', roomCode);
        if (room.roundTimeout) {
          clearTimeout(room.roundTimeout);
        }
        delete rooms[roomCode];
      }
    }
  });
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log('Server running on http://localhost:' + PORT);
});
