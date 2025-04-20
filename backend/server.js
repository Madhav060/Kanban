const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize express
const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io with the HTTP server
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },
});

// Handle socket connections
io.on('connection', (socket) => {
  console.log(`✅ New client connected: ${socket.id}`);

  socket.on('send-message', (data) => {
    console.log('📩 Message received:', data);
    io.emit('receive-message', data);
  });

  socket.on('task-updated', () => {
    console.log('📝 Task updated, notifying clients');
    io.emit('task-updated');
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Make `io` accessible in routes if needed
app.set('io', io);

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes')); // ✅ Added task routes
app.use('/api/user', require('./routes/userTask'));

app.get('/', (req, res) => {
  res.send('Kanban Board Backend is running 🚀');
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
