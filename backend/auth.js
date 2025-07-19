// Enhanced Authentication logic for Note Taking App
// In-memory user store with password hashing for security

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const SECRET = process.env.JWT_SECRET || 'supersecretkey-change-in-production';
const SALT_ROUNDS = 12;

// Enhanced in-memory user store
const users = [];
const sessions = new Map(); // Track active sessions

// Utility functions
function findUser(username) {
  return users.find(u => u.username === username);
}

function findUserById(id) {
  return users.find(u => u.id === id);
}

// Enhanced signup function
async function signup(username, password) {
  try {
    if (!username || !password) {
      throw new Error('Username and password are required');
    }
    
    if (findUser(username)) {
      throw new Error('Username already exists');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    // Create user with additional metadata
    const user = {
      id: uuidv4(),
      username,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      isActive: true
    };
    
    users.push(user);
    
    // Return user info without password
    const { password: _, ...userInfo } = user;
    return userInfo;
  } catch (error) {
    throw error;
  }
}

// Enhanced login function
async function login(username, password) {
  try {
    if (!username || !password) {
      throw new Error('Username and password are required');
    }
    
    const user = findUser(username);
    if (!user) {
      throw new Error('Invalid username or password');
    }
    
    // Validate password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid username or password');
    }
    
    // Update last login
    user.lastLogin = new Date().toISOString();
    
    // Create session
    const sessionId = uuidv4();
    const session = {
      id: sessionId,
      userId: user.id,
      username: user.username,
      createdAt: new Date(),
      lastActivity: new Date(),
      isActive: true
    };
    
    sessions.set(sessionId, session);
    
    // Generate JWT
    const payload = {
      id: user.id,
      username: user.username,
      sessionId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };
    
    const token = jwt.sign(payload, SECRET);
    
    // Return user info without password
    const { password: _, ...userInfo } = user;
    return {
      token,
      user: userInfo,
      sessionId
    };
  } catch (error) {
    throw error;
  }
}

// Enhanced token verification
async function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, SECRET);
    
    // Check if user still exists and is active
    const user = findUserById(decoded.id);
    if (!user || !user.isActive) {
      return null;
    }
    
    return decoded;
  } catch (err) {
    return null;
  }
}

// Synchronous version for middleware
function verifyTokenSync(token) {
  try {
    const decoded = jwt.verify(token, SECRET);
    const user = findUserById(decoded.id);
    if (!user || !user.isActive) {
      return null;
    }
    return decoded;
  } catch (err) {
    return null;
  }
}

// Session management
function getActiveSession(sessionId) {
  return sessions.get(sessionId);
}

function updateSessionActivity(sessionId) {
  const session = sessions.get(sessionId);
  if (session) {
    session.lastActivity = new Date().toISOString();
  }
}

function logout(sessionId) {
  return sessions.delete(sessionId);
}

// Clean up expired sessions (run periodically)
function cleanupSessions() {
  const now = new Date();
  const expiredTime = 24 * 60 * 60 * 1000; // 24 hours
  
  for (const [sessionId, session] of sessions.entries()) {
    const lastActivity = new Date(session.lastActivity);
    if (now - lastActivity > expiredTime) {
      sessions.delete(sessionId);
    }
  }
}

// Get user stats from in-memory store
async function getUserStats() {
  try {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive).length;
    const recentUsers = users.filter(u => {
      const lastLogin = new Date(u.lastLogin || u.createdAt);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return lastLogin > dayAgo;
    }).length;
    
    return {
      totalUsers,
      activeUsers,
      recentUsers,
      activeSessions: sessions.size
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return {
      totalUsers: 0,
      activeUsers: 0,
      recentUsers: 0,
      activeSessions: sessions.size,
      error: 'Unable to fetch user statistics'
    };
  }
}

module.exports = {
  signup,
  login,
  verifyToken,
  verifyTokenSync,
  getActiveSession,
  updateSessionActivity,
  logout,
  cleanupSessions,
  getUserStats,
  sessions // For testing/debugging only
};

// Run session cleanup every hour
setInterval(cleanupSessions, 60 * 60 * 1000);
