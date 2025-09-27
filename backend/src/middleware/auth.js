// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authentication middleware
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ 
        success: false,
        message: 'No token provided, authorization denied' 
      });
    }

    // Check if token starts with 'Bearer '
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token format' 
      });
    }

    // Extract token
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'No token provided, authorization denied' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await User.findById(decoded.id).select('-passwordHash');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Token is valid but user not found' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        success: false,
        message: 'User account is deactivated' 
      });
    }

    // Add user to request object
    req.user = {
      id: user._id.toString(),
      role: user.role,
      name: user.name,
      email: user.email,
      isActive: user.isActive
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token' 
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token expired' 
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Server error during authentication' 
    });
  }
};

// Admin only middleware
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication required' 
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. Admin privileges required.' 
    });
  }

  next();
};

// Optional auth middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without user
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return next(); // Continue without user
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash');
    
    if (user && user.isActive) {
      req.user = {
        id: user._id.toString(),
        role: user.role,
        name: user.name,
        email: user.email,
        isActive: user.isActive
      };
    }

    next();
  } catch (error) {
    // For optional auth, we don't send error response, just continue
    next();
  }
};

// Student or Admin middleware
const studentOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication required' 
    });
  }

  if (req.user.role !== 'student' && req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. Valid user role required.' 
    });
  }

  next();
};

// Check if user owns resource or is admin
const ownerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication required' 
    });
  }

  // Admin can access anything
  if (req.user.role === 'admin') {
    return next();
  }

  // For other users, they need to own the resource
  // This will be checked in the specific route handler
  req.requireOwnership = true;
  next();
};

module.exports = { 
  auth, 
  adminOnly, 
  optionalAuth, 
  studentOrAdmin, 
  ownerOrAdmin 
};