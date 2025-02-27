import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors());
app.use(express.json());
app.use(limiter);

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// In-memory storage (replace with a database in production)
const users = {};
const rooms = {};
const messages = {};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) return res.sendStatus(401);
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// User registration
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  if (users[username]) {
    return res.status(409).json({ error: 'Username already exists' });
  }
  
  const userId = uuidv4();
  users[username] = {
    id: userId,
    username,
    password, // In production, hash passwords!
  };
  
  const token = jwt.sign({ id: userId, username }, JWT_SECRET, { expiresIn: '24h' });
  
  res.status(201).json({ token, userId, username });
});

// User login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  const user = users[username];
  
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const token = jwt.sign({ id: user.id, username }, JWT_SECRET, { expiresIn: '24h' });
  
  res.json({ token, userId: user.id, username });
});

// Create a new room
app.post('/api/rooms', authenticateToken, (req, res) => {
  const roomId = uuidv4().substring(0, 8);
  
  rooms[roomId] = {
    id: roomId,
    createdBy: req.user.id,
    participants: {},
    createdAt: new Date(),
  };
  
  messages[roomId] = [];
  
  res.status(201).json({ roomId });
});

// Get room info
app.get('/api/rooms/:roomId', authenticateToken, (req, res) => {
  const { roomId } = req.params;
  
  if (!rooms[roomId]) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  res.json(rooms[roomId]);
});

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error'));
  }
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error('Authentication error'));
    socket.user = decoded;
    next();
  });
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.username}`);
  
  // Join a room
  socket.on('join-room', ({ roomId }) => {
    if (!rooms[roomId]) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
    // Add user to room
    socket.join(roomId);
    rooms[roomId].participants[socket.user.id] = {
      id: socket.user.id,
      username: socket.user.username,
      socketId: socket.id,
    };
    
    // Send room info to the user
    socket.emit('room-joined', {
      room: rooms[roomId],
      messages: messages[roomId],
    });
    
    // Notify others
    socket.to(roomId).emit('user-joined', {
      user: {
        id: socket.user.id,
        username: socket.user.username,
      },
    });
    
    // Send updated participant list to everyone
    io.to(roomId).emit('participants-updated', rooms[roomId].participants);
  });
  
  // Leave room
  socket.on('leave-room', ({ roomId }) => {
    if (rooms[roomId] && rooms[roomId].participants[socket.user.id]) {
      // Remove user from room
      delete rooms[roomId].participants[socket.user.id];
      socket.leave(roomId);
      
      // Notify others
      socket.to(roomId).emit('user-left', {
        userId: socket.user.id,
      });
      
      // Send updated participant list
      io.to(roomId).emit('participants-updated', rooms[roomId].participants);
      
      // Clean up empty rooms
      if (Object.keys(rooms[roomId].participants).length === 0) {
        delete rooms[roomId];
        delete messages[roomId];
      }
    }
  });
  
  // Handle chat messages
  socket.on('send-message', ({ roomId, content }) => {
    if (!rooms[roomId]) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
    const message = {
      id: uuidv4(),
      content,
      sender: {
        id: socket.user.id,
        username: socket.user.username,
      },
      timestamp: new Date(),
    };
    
    // Store message
    messages[roomId].push(message);
    
    // Broadcast to room
    io.to(roomId).emit('new-message', message);
  });
  
  // WebRTC signaling
  socket.on('signal', ({ userId, signal }) => {
    const userSocketId = findSocketIdByUserId(userId);
    if (userSocketId) {
      io.to(userSocketId).emit('signal', {
        userId: socket.user.id,
        signal,
      });
    }
  });
  
  // Handle call requests
  socket.on('call-user', ({ roomId, userId, callType }) => {
    const userSocketId = findSocketIdByUserId(userId);
    if (userSocketId) {
      io.to(userSocketId).emit('call-request', {
        callerId: socket.user.id,
        callerName: socket.user.username,
        callType,
      });
    }
  });
  
  // Handle call responses
  socket.on('call-response', ({ userId, accepted }) => {
    const userSocketId = findSocketIdByUserId(userId);
    if (userSocketId) {
      io.to(userSocketId).emit('call-response', {
        userId: socket.user.id,
        accepted,
      });
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.username}`);
    
    // Remove user from all rooms
    for (const roomId in rooms) {
      if (rooms[roomId].participants[socket.user.id]) {
        delete rooms[roomId].participants[socket.user.id];
        
        // Notify others
        socket.to(roomId).emit('user-left', {
          userId: socket.user.id,
        });
        
        // Send updated participant list
        io.to(roomId).emit('participants-updated', rooms[roomId].participants);
        
        // Clean up empty rooms
        if (Object.keys(rooms[roomId].participants).length === 0) {
          delete rooms[roomId];
          delete messages[roomId];
        }
      }
    }
  });
  
  // Helper function to find socket ID by user ID
  function findSocketIdByUserId(userId) {
    for (const roomId in rooms) {
      const participant = rooms[roomId].participants[userId];
      if (participant) {
        return participant.socketId;
      }
    }
    return null;
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});