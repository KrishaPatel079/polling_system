// backend/src/routes/polls.js
const express = require('express');
const router = express.Router();

// Test if controllers exist
let pollController;
try {
  pollController = require('../controllers/pollController');
  console.log('Poll controller loaded. Available functions:', Object.keys(pollController));
} catch (error) {
  console.error('Failed to load poll controller:', error.message);
  pollController = {};
}

let voteController;
try {
  voteController = require('../controllers/voteController');
  console.log('Vote controller loaded. Available functions:', Object.keys(voteController));
} catch (error) {
  console.error('Failed to load vote controller:', error.message);
  voteController = {};
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
    adminOnly: (req, res, next) => next(),
    optionalAuth: (req, res, next) => next(),
    studentOrAdmin: (req, res, next) => next()
  };
}

// Simple validation middleware
const validatePollCreation = (req, res, next) => {
  const { title, options } = req.body;
  if (!title || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Title and at least 2 options are required'
    });
  }
  next();
};

// Routes with fallback handlers
router.get('/', authMiddleware.optionalAuth || ((req, res, next) => next()), (req, res) => {
  if (pollController.listPolls && typeof pollController.listPolls === 'function') {
    return pollController.listPolls(req, res);
  } else {
    console.error('ListPolls function not found');
    res.status(500).json({ success: false, message: 'List polls function not available' });
  }
});

router.post('/', 
  authMiddleware.auth || ((req, res, next) => next()), 
  authMiddleware.adminOnly || ((req, res, next) => next()), 
  validatePollCreation, 
  (req, res) => {
    if (pollController.createPoll && typeof pollController.createPoll === 'function') {
      return pollController.createPoll(req, res);
    } else {
      console.error('CreatePoll function not found');
      res.status(500).json({ success: false, message: 'Create poll function not available' });
    }
  }
);

router.get('/my', authMiddleware.auth || ((req, res, next) => next()), (req, res) => {
  if (pollController.getMyPolls && typeof pollController.getMyPolls === 'function') {
    return pollController.getMyPolls(req, res);
  } else {
    console.error('GetMyPolls function not found');
    res.status(500).json({ success: false, message: 'Get my polls function not available' });
  }
});

router.get('/:id', authMiddleware.optionalAuth || ((req, res, next) => next()), (req, res) => {
  if (pollController.getPoll && typeof pollController.getPoll === 'function') {
    return pollController.getPoll(req, res);
  } else {
    console.error('GetPoll function not found');
    res.status(500).json({ success: false, message: 'Get poll function not available' });
  }
});

router.put('/:id', authMiddleware.auth || ((req, res, next) => next()), (req, res) => {
  if (pollController.updatePoll && typeof pollController.updatePoll === 'function') {
    return pollController.updatePoll(req, res);
  } else {
    console.error('UpdatePoll function not found');
    res.status(500).json({ success: false, message: 'Update poll function not available' });
  }
});

router.delete('/:id', authMiddleware.auth || ((req, res, next) => next()), (req, res) => {
  if (pollController.deletePoll && typeof pollController.deletePoll === 'function') {
    return pollController.deletePoll(req, res);
  } else {
    console.error('DeletePoll function not found');
    res.status(500).json({ success: false, message: 'Delete poll function not available' });
  }
});

// Voting routes
router.post('/:id/vote', 
  authMiddleware.auth || ((req, res, next) => next()), 
  authMiddleware.studentOrAdmin || ((req, res, next) => next()),
  (req, res) => {
    if (voteController.castVote && typeof voteController.castVote === 'function') {
      return voteController.castVote(req, res);
    } else {
      console.error('CastVote function not found');
      res.status(500).json({ success: false, message: 'Cast vote function not available' });
    }
  }
);

router.get('/:id/stats', authMiddleware.optionalAuth || ((req, res, next) => next()), (req, res) => {
  if (voteController.getVoteStats && typeof voteController.getVoteStats === 'function') {
    return voteController.getVoteStats(req, res);
  } else {
    console.error('GetVoteStats function not found');
    res.status(500).json({ success: false, message: 'Get vote stats function not available' });
  }
});

router.get('/:id/vote-status', authMiddleware.auth || ((req, res, next) => next()), (req, res) => {
  if (voteController.checkVoteStatus && typeof voteController.checkVoteStatus === 'function') {
    return voteController.checkVoteStatus(req, res);
  } else {
    console.error('CheckVoteStatus function not found');
    res.status(500).json({ success: false, message: 'Check vote status function not available' });
  }
});

router.delete('/:id/vote', 
  authMiddleware.auth || ((req, res, next) => next()), 
  authMiddleware.studentOrAdmin || ((req, res, next) => next()),
  (req, res) => {
    if (voteController.removeVote && typeof voteController.removeVote === 'function') {
      return voteController.removeVote(req, res);
    } else {
      console.error('RemoveVote function not found');
      res.status(500).json({ success: false, message: 'Remove vote function not available' });
    }
  }
);

router.get('/votes/my', authMiddleware.auth || ((req, res, next) => next()), (req, res) => {
  if (voteController.getMyVotes && typeof voteController.getMyVotes === 'function') {
    return voteController.getMyVotes(req, res);
  } else {
    console.error('GetMyVotes function not found');
    res.status(500).json({ success: false, message: 'Get my votes function not available' });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Polls routes are working',
    timestamp: new Date().toISOString(),
    pollControllerFunctions: Object.keys(pollController),
    voteControllerFunctions: Object.keys(voteController),
    middlewareFunctions: Object.keys(authMiddleware)
  });
});

console.log('Poll routes setup completed');
module.exports = router;