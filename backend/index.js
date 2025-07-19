// Entry point for backend server
// Express server with JWT authentication, CRUD APIs, and MongoDB integration

// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const auth = require('./auth');
const notes = require('./notes');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Enhanced Auth routes
app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await auth.signup(username, password);
    res.status(201).json({ 
      message: 'Account created successfully',
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await auth.login(username, password);
    res.json({ 
      message: 'Login successful',
      token: result.token,
      user: {
        id: result.user.id,
        username: result.user.username,
        lastLogin: result.user.lastLogin
      },
      sessionId: result.sessionId
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(401).json({ error: err.message });
  }
});

// Logout endpoint
app.post('/api/logout', requireAuth, (req, res) => {
  const sessionId = req.headers['x-session-id'];
  if (sessionId) {
    auth.logout(sessionId);
  }
  res.json({ message: 'Logged out successfully' });
});

// Get current user info
app.get('/api/me', requireAuth, (req, res) => {
  res.json({
    id: req.user.id,
    username: req.user.username
  });
});

// Get auth stats (for admin/debugging)
app.get('/api/auth/stats', async (req, res) => {
  try {
    const stats = await auth.getUserStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching auth stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Enhanced middleware to protect routes
function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }
    
    const payload = auth.verifyTokenSync(token);
    if (!payload) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    // Update session activity if session ID provided
    const sessionId = req.headers['x-session-id'];
    if (sessionId) {
      auth.updateSessionActivity(sessionId);
    }
    
    req.user = payload;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
}

// Rate limiting middleware (simple implementation)
const rateLimitMap = new Map();
function rateLimit(maxRequests = 10, windowMs = 60000) {
  return (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!rateLimitMap.has(clientId)) {
      rateLimitMap.set(clientId, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const clientData = rateLimitMap.get(clientId);
    
    if (now > clientData.resetTime) {
      clientData.count = 1;
      clientData.resetTime = now + windowMs;
      return next();
    }
    
    if (clientData.count >= maxRequests) {
      return res.status(429).json({ 
        error: 'Too many requests',
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
      });
    }
    
    clientData.count++;
    next();
  };
}

// Apply rate limiting to auth routes
app.use('/api/signup', rateLimit(5, 300000)); // 5 requests per 5 minutes
app.use('/api/login', rateLimit(10, 300000)); // 10 requests per 5 minutes

// Notes CRUD routes (protected) - MongoDB integration
app.get('/api/notes', requireAuth, async (req, res) => {
  try {
    const { search, filter } = req.query;
    const userNotes = await notes.listNotes(req.user.id, { search, filter });
    res.json(userNotes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

app.get('/api/notes/:id', requireAuth, async (req, res) => {
  try {
    const note = await notes.getNote(req.user.id, req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json(note);
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

app.post('/api/notes', requireAuth, async (req, res) => {
  try {
    const { title, content, isPublic, tags, category } = req.body;
    const note = await notes.createNote(req.user.id, { 
      title, 
      content, 
      isPublic, 
      tags, 
      category 
    });
    res.status(201).json(note);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

app.put('/api/notes/:id', requireAuth, async (req, res) => {
  try {
    const note = await notes.updateNote(req.user.id, req.params.id, req.body);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json(note);
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

app.delete('/api/notes/:id', requireAuth, async (req, res) => {
  try {
    const success = await notes.deleteNote(req.user.id, req.params.id);
    if (!success) return res.status(404).json({ error: 'Note not found' });
    res.json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// Placeholder for notes and auth routes
app.get('/', (req, res) => {
  res.send('Note Taking App Backend');
});

// Start Express server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
});
