// backend/src/index.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Attach io to app so controllers can access it
app.set('io', io);

// Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Polling API running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Debug: Check if route files exist and are properly exported
console.log('Loading routes...');

try {
  const authRoutes = require('./routes/auth');
  console.log('Auth routes loaded:', typeof authRoutes);
  app.use('/api/auth', authRoutes);
} catch (error) {
  console.error('Error loading auth routes:', error.message);
}

try {
  const pollRoutes = require('./routes/polls');
  console.log('Poll routes loaded:', typeof pollRoutes);
  app.use('/api/polls', pollRoutes);
} catch (error) {
  console.error('Error loading poll routes:', error.message);
}

// 404 handler - must be last, using middleware instead of app.all
app.use((req, res, next) => {
  res.status(404).json({ 
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found` 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join poll room for real-time updates
  socket.on('joinPoll', (pollId) => {
    socket.join(`poll:${pollId}`);
    console.log(`Socket ${socket.id} joined poll:${pollId}`);
  });

  // Leave poll room
  socket.on('leavePoll', (pollId) => {
    socket.leave(`poll:${pollId}`);
    console.log(`Socket ${socket.id} left poll:${pollId}`);
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`User disconnected: ${socket.id}, reason: ${reason}`);
  });
});

const PORT = process.env.PORT || 4000;

// Connect to database and start server
connectDB(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 API available at http://localhost:${PORT}`);
      console.log(`🔌 Socket.IO ready for real-time connections`);
    });
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🔄 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = app;