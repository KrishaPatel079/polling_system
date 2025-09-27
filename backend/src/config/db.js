// backend/src/config/db.js
const mongoose = require('mongoose');

async function connectDB(uri) {
  try {
    const conn = await mongoose.connect(uri, {
      // Remove deprecated options
      // bufferMaxEntries: 0, // This is deprecated and causing the error
      
      // Keep only supported options
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4 // Use IPv4, skip trying IPv6
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected from MongoDB');
    });

    return conn;
  } catch (error) {
    console.error('Database connection error:', error.message);
    throw error;
  }
}

module.exports = connectDB;