// src/Game.jsx
import React, { useEffect, useState } from 'react';
import { socket } from './socket';
import CanvasBoard from './CanvasBoard';

function Game() {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [joined, setJoined] = useState(false);
  const [players, setPlayers] = useState({});
  const [error, setError] = useState('');

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');

  const [hostId, setHostId] = useState(null);
  const [myId, setMyId] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);

  const [chatInput, setChatInput] = useState('');
  // chatLog: entries can be { name, message } OR { system: true, text }
  const [chatLog, setChatLog] = useState([]);

  // drawer + word
  const [drawerId, setDrawerId] = useState(null);
  const [myWord, setMyWord] = useState(null);
  const [wordLength, setWordLength] = useState(0);
  const [wordChoices, setWordChoices] = useState([]);
  const [selectingWord, setSelectingWord] = useState(false);

  // timer
  const [roundEndTime, setRoundEndTime] = useState(null); // ms timestamp
  const [timeLeftSec, setTimeLeftSec] = useState(0);

  // round end modal
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [scoreboard, setScoreboard] = useState(null); // { players: [], word }

  useEffect(() => {
    console.log('Setting up socket listeners in Game');

    socket.on('connect', () => {
      console.log('Socket connected in Game, id =', socket.id);
      setMyId(socket.id);
    });

    socket.on('room_created', ({ roomCode, players, hostId }) => {
      console.log('room_created event received:', roomCode, players, hostId);
      setRoomCode(roomCode);
      setPlayers(players);
      setHostId(hostId);
      setJoined(true);
      setGameStarted(false);
      setError('');
      setDrawerId(null);
      setMyWord(null);
      setWordLength(0);
      setWordChoices([]);
      setSelectingWord(false);
      setChatLog([]);
      setRoundEndTime(null);
      setTimeLeftSec(0);
    });

    socket.on(
      'room_joined',
      ({ roomCode, players, hostId, gameStarted, drawerId, wordLength }) => {
        console.log(
          'room_joined event received:',
          roomCode,
          players,
          hostId,
          gameStarted,
          drawerId,
          wordLength
        );
        setRoomCode(roomCode);
        setPlayers(players);
        setHostId(hostId);
        setJoined(true);
        setGameStarted(!!gameStarted);
        setShowJoinModal(false);
        setError('');
        setDrawerId(drawerId || null);
        setMyWord(null);
        setWordLength(wordLength || 0);
        setWordChoices([]);
        setSelectingWord(false);
        setChatLog([]);
        setRoundEndTime(null);
        setTimeLeftSec(0);
      }
    );

    socket.on('room_error', ({ message }) => {
      console.log('room_error:', message);
      setError(message || 'Something went wrong');
    });

    socket.on('players_update', ({ players, hostId }) => {
      console.log('players_update:', players, hostId);
      setPlayers(players);
      if (hostId) setHostId(hostId);
    });

    socket.on('game_started', () => {
      console.log('game_started received');
      setGameStarted(true);
      setWordChoices([]);
      setSelectingWord(false);
      setMyWord(null);
      setWordLength(0);
      setRoundEndTime(null);
      setChatLog([]);
    });

    // round + word events
    socket.on(
      'round_started',
      ({ drawerId, wordLength, roundEndTime, roundNumber, turnNumber, totalTurns }) => {
        console.log(
          'round_started received, drawerId =',
          drawerId,
          'wordLength =',
          wordLength,
          'roundEndTime =',
          roundEndTime,
          'round =',
          roundNumber,
          'turn =',
          turnNumber,
          '/',
          totalTurns
        );
        setDrawerId(drawerId);
        setMyWord(null);
        setWordLength(wordLength || 0);
        setRoundEndTime(roundEndTime || null);
      setWordChoices([]);
      setSelectingWord(false);

        // log in chat
        setChatLog((prev) => [
          ...prev,
          {
            system: true,
            text:
              'New turn started' +
              (roundNumber && turnNumber && totalTurns
                ? ` (Round ${roundNumber}, Turn ${turnNumber}/${totalTurns})`
                : '') +
              '!',
          },
        ]);
        setShowScoreModal(false);
        setScoreboard(null);
      }
    );

    socket.on('word_options', ({ options }) => {
      console.log('word_options received:', options);
      setWordChoices(options || []);
      setSelectingWord(false);
      setMyWord(null);
      setWordLength(0);
      setRoundEndTime(null);
    });

    socket.on('word_selected', ({ wordLength, roundEndTime }) => {
      console.log('word_selected received:', wordLength, roundEndTime);
      setWordLength(wordLength || 0);
      setRoundEndTime(roundEndTime || null);
      setWordChoices([]);
      setSelectingWord(false);
      setChatLog((prev) => [
        ...prev,
        { system: true, text: 'Word chosen! Start guessing.' },
      ]);
    });

    socket.on('your_word', ({ word }) => {
      console.log('your_word received, word =', word);
      setMyWord(word);
      setWordLength(word.length);
      setSelectingWord(false);
      setWordChoices([]);
    });

    // normal chat messages
    socket.on('chat_message', ({ name, message }) => {
      setChatLog((prev) => [...prev, { name, message }]);
    });

    // correct guess messages
    socket.on('correct_guess', ({ playerId, name, score }) => {
      console.log('correct_guess received from', name, 'score =', score);
      setChatLog((prev) => [
        ...prev,
        { system: true, text: `${name} guessed the word! (+10 points)` },
      ]);
    });

    // round ended -> show modal, then server will start next round after 5s
    socket.on('round_ended', ({ players, word, roundComplete, roundNumber }) => {
      console.log(
        'round_ended received, word =',
        word,
        'players =',
        players,
        'roundComplete =',
        roundComplete,
        'roundNumber =',
        roundNumber
      );
      const list = Object.entries(players).map(([id, p]) => ({
        id,
        ...p,
      }));

      setRoundEndTime(null);
      setTimeLeftSec(0);
      setWordChoices([]);
      setSelectingWord(false);
      setMyWord(null);
      setWordLength(0);
      setDrawerId(null);

      if (roundComplete) {
        const roundLabel = roundNumber ? `Round ${roundNumber}` : 'Round';
        setScoreboard({
          word,
          players: list,
        });
        setShowScoreModal(true);

        setChatLog((prev) => [
          ...prev,
          {
            system: true,
            text: `${roundLabel} complete! The last word was "${word || '???'}".`,
          },
        ]);

        // hide modal after 5 seconds
        setTimeout(() => {
          setShowScoreModal(false);
        }, 5000);
      } else {
        setScoreboard(null);
        setShowScoreModal(false);
        setChatLog((prev) => [
          ...prev,
          {
            system: true,
            text: `Turn over! The word was "${word || '???'}". Next player is up shortly.`,
          },
        ]);
      }
    });

    return () => {
      console.log('Cleaning up socket listeners in Game');
      socket.off('connect');
      socket.off('room_created');
      socket.off('room_joined');
      socket.off('room_error');
      socket.off('players_update');
      socket.off('game_started');
      socket.off('round_started');
      socket.off('word_options');
      socket.off('word_selected');
      socket.off('your_word');
      socket.off('chat_message');
      socket.off('correct_guess');
      socket.off('round_ended');
    };
  }, []);

  // Countdown effect for roundEndTime
  useEffect(() => {
    if (!roundEndTime) {
      setTimeLeftSec(0);
      return;
    }

    const update = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.round((roundEndTime - now) / 1000));
      setTimeLeftSec(diff);
    };

    update(); // initial
    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);
  }, [roundEndTime]);

  const isHost = myId && hostId && myId === hostId;
  const isDrawer = myId && drawerId && myId === drawerId;

  // Actions
  const handleCreateRoom = () => {
    console.log('Create Room clicked, name =', name);
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    setError('');
    socket.emit('create_room', { name: name.trim() });
  };

  const handleOpenJoinModal = () => {
    if (!name.trim()) {
      setError('Please enter your name first.');
      return;
    }
    setError('');
    setShowJoinModal(true);
  };

  const handleJoinRoom = () => {
    console.log('Join Room clicked, code =', joinCodeInput);
    if (!joinCodeInput.trim()) {
      setError('Please enter a room code.');
      return;
    }
    setError('');
    socket.emit('join_room', {
      name: name.trim(),
      roomCode: joinCodeInput.trim().toLowerCase(),
    });
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    const msg = chatInput.trim();
    if (!msg) return;
    socket.emit('chat_message', { message: msg });
    setChatInput('');
  };

  const handleStartGame = () => {
    console.log('Start Game clicked by', myId);
    socket.emit('start_game');
  };

  const handleSelectWord = (word) => {
    if (!word || selectingWord || !wordChoices.includes(word)) return;
    setSelectingWord(true);
    socket.emit('select_word', { word });
  };

  // SCREEN 1: Not joined yet
  if (!joined) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-slate-900 text-slate-100">
        <div className="w-full max-w-md bg-slate-800 rounded-xl shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-4 text-center">Scribble Clone</h1>

          <label className="block mb-2 text-sm font-medium text-slate-200">
            Enter your name
          </label>
          <input
            className="w-full mb-4 px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {error && (
            <div className="mb-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition font-semibold"
              onClick={handleCreateRoom}
            >
              Create Room
            </button>
            <button
              className="flex-1 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 border border-slate-500 transition font-semibold"
              onClick={handleOpenJoinModal}
            >
              Join Room
            </button>
          </div>

          {showJoinModal && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
              <div className="bg-slate-800 rounded-xl p-6 w-full max-w-sm shadow-xl">
                <h2 className="text-xl font-bold mb-4">Join Room</h2>
                <p className="text-sm text-slate-300 mb-2">
                  Enter the room code from your friend.
                </p>
                <input
                  className="w-full mb-4 px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                  placeholder="room-code-here"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value)}
                />
                <div className="flex justify-end gap-3">
                  <button
                    className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600"
                    onClick={() => setShowJoinModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-semibold"
                    onClick={handleJoinRoom}
                  >
                    Enter
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // SCREEN 2: Lobby (joined, game not started)
  if (!gameStarted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-slate-100">
        <div className="bg-slate-800 rounded-xl shadow-lg p-6 w-full max-w-lg">
          <h1 className="text-xl font-bold mb-2 text-center">Lobby</h1>
          <p className="text-sm text-slate-400 text-center mb-4">
            Room code:{' '}
            <span className="font-mono text-indigo-300">{roomCode}</span>
          </p>

          <h2 className="text-sm font-semibold mb-2 uppercase tracking-wide text-slate-400">
            Players in lobby
          </h2>
          <ul className="space-y-1 text-sm mb-4">
            {Object.entries(players).map(([id, p]) => (
              <li
                key={id}
                className="px-2 py-1 rounded bg-slate-700/70 flex items-center justify-between"
              >
                <div>
                  <span>{p.name}</span>
                  <span className="ml-2 text-xs text-slate-300">
                    Score: {p.score ?? 0}
                  </span>
                </div>
                {id === hostId && (
                  <span className="text-xs text-amber-300">Host</span>
                )}
              </li>
            ))}
          </ul>

          {isHost ? (
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-2">
                You are the host. Click start when everyone is ready.
              </p>
              <button
                onClick={handleStartGame}
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 font-semibold"
              >
                Start Game
              </button>
            </div>
          ) : (
            <p className="text-xs text-center text-slate-400">
              Waiting for the host to start the game…
            </p>
          )}

          {error && (
            <div className="mt-3 text-sm text-red-400 text-center">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Helper to render blanks for guessers
  const renderBlanks = () => {
    if (!wordLength) return '';
    return Array(wordLength).fill('_').join(' ');
  };

  // SCREEN 3: Game started (canvas + chat + word info)
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <header className="w-full border-b border-slate-800 bg-slate-950/70 backdrop-blur flex items-center justify-between px-6 py-3">
        <div>
          <h1 className="text-lg font-bold">Scribble Clone</h1>
          <p className="text-xs text-slate-400">
            Room:{' '}
            <span className="font-mono text-indigo-300">{roomCode}</span>
          </p>
        </div>
        <div className="text-sm flex flex-col items-end">
          <div>
            <span className="text-slate-400">You: </span>
            <span className="font-semibold">{name}</span>
            {isHost && (
              <span className="ml-2 text-xs text-amber-300">(Host)</span>
            )}
          </div>
          <div className="text-xs text-slate-400">
            Time left: <span className="font-mono">{timeLeftSec}s</span>
          </div>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {/* Left: Canvas and word info */}
        <div className="flex-1 flex flex-col items-center justify-start p-4 gap-3">
          <div className="w-full max-w-4xl text-center mb-2">
            {isDrawer ? (
              myWord ? (
                <p className="text-sm">
                  You are drawing. Your word:{' '}
                  <span className="font-bold text-indigo-300">
                    {myWord || '...'}
                  </span>
                </p>
              ) : wordChoices.length > 0 ? (
                <p className="text-sm">
                  You are drawing. Pick a word to start the round.
                </p>
              ) : (
                <p className="text-sm text-slate-400">
                  Waiting for word options…
                </p>
              )
            ) : wordLength ? (
              <p className="text-sm">
                Guess the word:{' '}
                <span className="font-mono tracking-widest text-xl">
                  {renderBlanks()}
                </span>
              </p>
            ) : (
              <p className="text-sm text-slate-400">
                Waiting for the drawer to pick a word…
              </p>
            )}
          </div>
          {isDrawer && !myWord && wordChoices.length > 0 && (
            <div className="w-full max-w-4xl bg-slate-800/60 border border-slate-700 rounded-lg p-4 text-left">
              <p className="text-sm font-semibold mb-3 text-slate-100">
                Choose a word to draw
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                {wordChoices.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleSelectWord(option)}
                    disabled={selectingWord}
                    className="w-full px-3 py-2 rounded-md bg-slate-700 hover:bg-slate-600 border border-slate-600 text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {option}
                  </button>
                ))}
              </div>
              {selectingWord && (
                <p className="text-xs text-slate-400 mt-2">
                  Waiting for server to start the timer…
                </p>
              )}
            </div>
          )}
          <CanvasBoard />
        </div>

        {/* Right: players + chat */}
        <aside className="w-80 border-l border-slate-800 flex flex-col">
          <div className="border-b border-slate-800 p-4">
            <h2 className="text-sm font-semibold mb-2 uppercase tracking-wide text-slate-400">
              Players
            </h2>
            <ul className="space-y-1 text-sm">
              {Object.entries(players).map(([id, p]) => (
                <li
                  key={id}
                  className="flex items-center justify-between px-2 py-1 rounded-md bg-slate-800/60"
                >
                  <div className="flex flex-col">
                    <span>{p.name}</span>
                    <span className="text-xs text-slate-400">
                      Score: {p.score ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    {id === hostId && (
                      <span className="text-amber-300">Host</span>
                    )}
                    {id === drawerId && (
                      <span className="text-sky-300">Drawing</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex-1 flex flex-col p-4">
            <h2 className="text-sm font-semibold mb-2 uppercase tracking-wide text-slate-400">
              Chat / Guesses
            </h2>
            <div className="flex-1 mb-3 rounded-lg border border-slate-800 bg-slate-900/60 overflow-y-auto p-2 text-sm">
              {chatLog.map((entry, idx) =>
                entry.system ? (
                  <div key={idx} className="mb-1 italic text-slate-400">
                    {entry.text}
                  </div>
                ) : (
                  <div key={idx} className="mb-1">
                    <span className="font-semibold text-indigo-300">
                      {entry.name}:
                    </span>{' '}
                    <span>{entry.message}</span>
                  </div>
                )
              )}
            </div>
            <form onSubmit={handleSendChat} className="flex gap-2">
              <input
                className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Type your guess..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold"
              >
                Send
              </button>
            </form>
          </div>
        </aside>
      </main>

      {/* Round over modal / scoreboard */}
      {showScoreModal && scoreboard && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-xl font-bold mb-2 text-center">Round Over</h2>
            <p className="text-sm text-slate-300 mb-4 text-center">
              The word was:{' '}
              <span className="font-semibold text-indigo-300">
                {scoreboard.word}
              </span>
            </p>
            <h3 className="text-sm font-semibold mb-2 text-slate-200">
              Scores
            </h3>
            <ul className="space-y-1 text-sm max-h-48 overflow-y-auto">
              {scoreboard.players
                .slice()
                .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
                .map((p) => (
                  <li
                    key={p.id}
                    className="flex justify-between px-2 py-1 rounded bg-slate-700/70"
                  >
                    <span>{p.name}</span>
                    <span className="font-mono text-slate-200">
                      {p.score ?? 0}
                    </span>
                  </li>
                ))}
            </ul>
            <p className="mt-4 text-xs text-slate-400 text-center">
              Next round starting shortly…
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Game;
