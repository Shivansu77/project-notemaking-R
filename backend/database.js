// MongoDB Database Connection and Configuration
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/notetaker';

// Fallback flag for when MongoDB is not available
let mongoAvailable = true;

// Connection options for better performance and reliability
const connectionOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  bufferMaxEntries: 0, // Disable mongoose buffering
  bufferCommands: false, // Disable mongoose buffering
};

// Connect to MongoDB with fallback
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, connectionOptions);
    console.log('✅ Connected to MongoDB successfully');
    mongoAvailable = true;
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
      mongoAvailable = false;
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
      mongoAvailable = false;
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
      mongoAvailable = true;
    });
    
  } catch (error) {
    console.warn('⚠️  MongoDB not available, using in-memory storage:', error.message);
    mongoAvailable = false;
    // Don't exit, continue with in-memory fallback
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('📴 MongoDB connection closed through app termination');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during MongoDB shutdown:', error);
    process.exit(1);
  }
});

module.exports = {
  connectDB,
  mongoose
};
