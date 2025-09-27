// backend/src/models/Vote.js
const mongoose = require('mongoose');

const VoteSchema = new mongoose.Schema({
  pollId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poll',
    required: [true, 'Poll ID is required']
  },
  optionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Option ID is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  votedAt: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index to ensure one vote per user per poll (for polls that don't allow multiple votes)
VoteSchema.index({ pollId: 1, userId: 1 });

// Individual indexes for queries
VoteSchema.index({ pollId: 1 });
VoteSchema.index({ userId: 1 });
VoteSchema.index({ votedAt: -1 });
VoteSchema.index({ optionId: 1 });

// Static method to check if user has voted on a poll
VoteSchema.statics.hasUserVoted = function(pollId, userId) {
  return this.findOne({ pollId, userId }).then(vote => !!vote);
};

// Static method to get vote statistics for a poll
VoteSchema.statics.getStats = async function(pollId) {
  try {
    const votes = await this.find({ pollId });
    
    // Count votes per option
    const optionVotes = {};
    votes.forEach(vote => {
      const optionId = vote.optionId.toString();
      optionVotes[optionId] = (optionVotes[optionId] || 0) + 1;
    });

    return {
      totalVotes: votes.length,
      optionVotes,
      uniqueVoters: votes.length // Assuming one vote per user
    };
  } catch (error) {
    console.error('Error getting vote stats:', error);
    return {
      totalVotes: 0,
      optionVotes: {},
      uniqueVoters: 0
    };
  }
};

// Static method to get voting history for a user
VoteSchema.statics.getUserVotes = function(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return this.find({ userId })
    .populate('pollId', 'title description')
    .sort({ votedAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get recent votes for a poll
VoteSchema.statics.getRecentVotes = function(pollId, limit = 10) {
  return this.find({ pollId })
    .populate('userId', 'name')
    .sort({ votedAt: -1 })
    .limit(limit);
};

// Static method to get vote count by time period
VoteSchema.statics.getVotesByPeriod = async function(pollId, period = 'day') {
  const now = new Date();
  let startDate;

  switch (period) {
    case 'hour':
      startDate = new Date(now - 60 * 60 * 1000);
      break;
    case 'day':
      startDate = new Date(now - 24 * 60 * 60 * 1000);
      break;
    case 'week':
      startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now - 24 * 60 * 60 * 1000);
  }

  return this.countDocuments({
    pollId,
    votedAt: { $gte: startDate }
  });
};

// Instance method to get vote details with poll and user info
VoteSchema.methods.getDetails = function() {
  return this.populate([
    { path: 'pollId', select: 'title description options' },
    { path: 'userId', select: 'name email' }
  ]);
};

module.exports = mongoose.model('Vote', VoteSchema);