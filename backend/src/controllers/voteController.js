// backend/src/controllers/voteController.js
const Vote = require('../models/Vote');
const Poll = require('../models/Poll');
const mongoose = require('mongoose');

// Cast a vote
const castVote = async (req, res) => {
  try {
    const { pollId, optionId } = req.body;
    const userId = req.user.id;

    // Validation
    if (!pollId || !optionId) {
      return res.status(400).json({
        success: false,
        message: 'Poll ID and Option ID are required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(pollId) || !mongoose.Types.ObjectId.isValid(optionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Poll ID or Option ID'
      });
    }

    // Find the poll
    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    // Check if poll is voteable
    if (!poll.canVote()) {
      return res.status(400).json({
        success: false,
        message: 'This poll is not available for voting'
      });
    }

    // Check if option exists in poll
    const option = poll.options.id(optionId);
    if (!option) {
      return res.status(400).json({
        success: false,
        message: 'Option not found in this poll'
      });
    }

    // Check if user has already voted
    const existingVote = await Vote.findOne({ pollId, userId });
    if (existingVote && !poll.allowMultipleVotes) {
      return res.status(400).json({
        success: false,
        message: 'You have already voted in this poll'
      });
    }

    // If multiple votes allowed and user is changing vote
    if (existingVote && poll.allowMultipleVotes) {
      // Remove vote from previous option
      const previousOption = poll.options.id(existingVote.optionId);
      if (previousOption) {
        previousOption.votes = Math.max(0, previousOption.votes - 1);
      }
      
      // Update existing vote
      existingVote.optionId = optionId;
      existingVote.votedAt = new Date();
      await existingVote.save();
    } else {
      // Create new vote
      await Vote.create({
        pollId,
        optionId,
        userId,
        votedAt: new Date()
      });
    }

    // Update option vote count
    option.votes += 1;
    poll.totalVotes = poll.calculatedTotalVotes;
    await poll.save();

    // Get updated poll with stats
    const updatedPoll = await Poll.findById(pollId).populate('createdBy', 'name');
    const stats = updatedPoll.getStats();

    // Emit real-time update to all clients in the poll room
    const io = req.app.get('io');
    if (io) {
      io.to(`poll:${pollId}`).emit('voteUpdate', {
        pollId,
        optionId,
        stats,
        totalVotes: updatedPoll.totalVotes
      });
    }

    console.log(`Vote cast: User ${req.user.name} voted on poll "${poll.title}"`);

    res.status(201).json({
      success: true,
      message: 'Vote cast successfully',
      vote: {
        pollId,
        optionId,
        votedAt: new Date()
      },
      stats
    });
  } catch (error) {
    console.error('Cast vote error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error casting vote'
    });
  }
};

// Get vote statistics for a poll
const getVoteStats = async (req, res) => {
  try {
    const { pollId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(pollId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid poll ID'
      });
    }

    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    const stats = poll.getStats();
    
    // Get detailed voting information
    const votes = await Vote.find({ pollId })
      .populate('userId', 'name')
      .sort({ votedAt: -1 })
      .lean();

    // Group votes by option
    const votesByOption = {};
    votes.forEach(vote => {
      if (!votesByOption[vote.optionId]) {
        votesByOption[vote.optionId] = [];
      }
      votesByOption[vote.optionId].push({
        userId: vote.userId._id,
        userName: vote.userId.name,
        votedAt: vote.votedAt
      });
    });

    res.json({
      success: true,
      stats: {
        ...stats,
        votesByOption,
        totalVoters: votes.length,
        recentVotes: votes.slice(0, 10) // Last 10 votes
      }
    });
  } catch (error) {
    console.error('Get vote stats error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error fetching vote statistics'
    });
  }
};

// Get user's voting history
const getMyVotes = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const votes = await Vote.find({ userId })
      .populate('pollId', 'title description isActive endAt createdAt')
      .sort({ votedAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const totalVotes = await Vote.countDocuments({ userId });

    // Enhance votes with option details
    const enhancedVotes = await Promise.all(
      votes.map(async (vote) => {
        if (!vote.pollId) return vote; // Skip if poll was deleted
        
        const poll = await Poll.findById(vote.pollId._id);
        const option = poll ? poll.options.id(vote.optionId) : null;
        
        return {
          ...vote,
          option: option ? { text: option.text, votes: option.votes } : null,
          pollStatus: poll ? poll.status : 'deleted'
        };
      })
    );

    const totalPages = Math.ceil(totalVotes / limitNum);

    res.json({
      success: true,
      votes: enhancedVotes,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalVotes,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Get my votes error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error fetching voting history'
    });
  }
};

// Remove/change vote (if allowed)
const removeVote = async (req, res) => {
  try {
    const { pollId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(pollId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid poll ID'
      });
    }

    // Find the vote
    const vote = await Vote.findOne({ pollId, userId });
    if (!vote) {
      return res.status(404).json({
        success: false,
        message: 'Vote not found'
      });
    }

    // Find the poll
    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    // Check if poll allows vote changes (you might want to add this field to poll schema)
    if (!poll.canVote()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove vote from this poll'
      });
    }

    // Update option vote count
    const option = poll.options.id(vote.optionId);
    if (option) {
      option.votes = Math.max(0, option.votes - 1);
      poll.totalVotes = poll.calculatedTotalVotes;
      await poll.save();
    }

    // Remove vote
    await Vote.findByIdAndDelete(vote._id);

    // Get updated stats
    const stats = poll.getStats();

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`poll:${pollId}`).emit('voteUpdate', {
        pollId,
        optionId: vote.optionId,
        stats,
        totalVotes: poll.totalVotes
      });
    }

    console.log(`Vote removed: User ${req.user.name} removed vote from poll "${poll.title}"`);

    res.json({
      success: true,
      message: 'Vote removed successfully',
      stats
    });
  } catch (error) {
    console.error('Remove vote error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error removing vote'
    });
  }
};

// Check if user has voted on a specific poll
const checkVoteStatus = async (req, res) => {
  try {
    const { pollId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(pollId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid poll ID'
      });
    }

    const vote = await Vote.findOne({ pollId, userId });
    const hasVoted = !!vote;

    res.json({
      success: true,
      hasVoted,
      vote: hasVoted ? {
        optionId: vote.optionId,
        votedAt: vote.votedAt
      } : null
    });
  } catch (error) {
    console.error('Check vote status error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error checking vote status'
    });
  }
};

module.exports = {
  castVote,
  getVoteStats,
  getMyVotes,
  removeVote,
  checkVoteStatus
};