// backend/src/routes/auth.js
const express = require('express');
const router = express.Router();

// Test if controllers exist
let authController;
try {
  authController = require('../controllers/authController');
  console.log('Auth controller loaded. Available functions:', Object.keys(authController));
} catch (error) {
  console.error('Failed to load auth controller:', error.message);
  authController = {};
}

// Test if middleware exists
let authMiddleware;
try {
  authMiddleware = require('../middleware/auth');
  console.log('Auth middleware loaded. Available functions:', Object.keys(authMiddleware));
} catch (error) {
  console.error('Failed to load auth middleware:', error.message);
  authMiddleware = {
    auth: (req, res, next) => next(),
    adminOnly: (req, res, next) => next()
  };
}

// Simple validation middleware
const validateRegistration = (req, res, next) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and password are required'
    });
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }
  next();
};

// Routes with fallback handlers
router.post('/register', validateRegistration, (req, res) => {
  if (authController.register && typeof authController.register === 'function') {
    return authController.register(req, res);
  } else {
    console.error('Register function not found in auth controller');
    res.status(500).json({ success: false, message: 'Register function not available' });
  }
});

router.post('/login', validateLogin, (req, res) => {
  if (authController.login && typeof authController.login === 'function') {
    return authController.login(req, res);
  } else {
    console.error('Login function not found in auth controller');
    res.status(500).json({ success: false, message: 'Login function not available' });
  }
});

router.get('/me', authMiddleware.auth || ((req, res, next) => next()), (req, res) => {
  if (authController.me && typeof authController.me === 'function') {
    return authController.me(req, res);
  } else {
    console.error('Me function not found in auth controller');
    res.status(500).json({ success: false, message: 'Profile function not available' });
  }
});

router.put('/profile', authMiddleware.auth || ((req, res, next) => next()), (req, res) => {
  if (authController.updateProfile && typeof authController.updateProfile === 'function') {
    return authController.updateProfile(req, res);
  } else {
    console.error('UpdateProfile function not found in auth controller');
    res.status(500).json({ success: false, message: 'Update profile function not available' });
  }
});

router.put('/change-password', authMiddleware.auth || ((req, res, next) => next()), (req, res) => {
  if (authController.changePassword && typeof authController.changePassword === 'function') {
    return authController.changePassword(req, res);
  } else {
    console.error('ChangePassword function not found in auth controller');
    res.status(500).json({ success: false, message: 'Change password function not available' });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Auth routes are working',
    timestamp: new Date().toISOString(),
    controllerFunctions: Object.keys(authController),
    middlewareFunctions: Object.keys(authMiddleware)
  });
});

console.log('Auth routes setup completed');
module.exports = router;