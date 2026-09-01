const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const rooms = {};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join-room', (roomCode) => {
    const code = roomCode.toUpperCase().trim() || 'LOBBY';
    socket.join(code);
    socket.roomCode = code;

    if (!rooms[code]) {
      rooms[code] = {};
    }

    rooms[code][socket.id] = {
      id: socket.id,
      x: 0, y: 0, z: 0,
      ry: 0
    };

    io.to(code).emit('update-players', rooms[code]);
  });

  socket.on('player-move', (data) => {
    const code = socket.roomCode;
    if (code && rooms[code] && rooms[code][socket.id]) {
      rooms[code][socket.id] = { ...rooms[code][socket.id], ...data };
      socket.to(code).emit('player-move', rooms[code][socket.id]);
    }
  });

  socket.on('disconnect', () => {
    const code = socket.roomCode;
    if (code && rooms[code]) {
      delete rooms[code][socket.id];
      if (Object.keys(rooms[code]).length === 0) {
        delete rooms[code];
      } else {
        socket.to(code).emit('player-disconnect', socket.id);
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
