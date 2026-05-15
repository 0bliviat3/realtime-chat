import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { setupSocketEvents } from './socket/handlers';
import { pool } from './db/db';

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

// Setup Socket.IO events
setupSocketEvents(io);

// Test DB connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('DB connection error:', err.stack);
  } else {
    console.log('DB connected successfully');
  }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Setup socket events
setupSocketEvents(io);

// Start server
const PORT = process.env['PORT'] || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { io };