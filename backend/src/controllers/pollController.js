// backend/src/controllers/pollController.js
const Poll = require('../models/Poll');
const Vote = require('../models/Vote');
const mongoose = require('mongoose');

// Create a new poll (Admin only)
const createPoll = async (req, res) => {
  try {
    const { title, description, options, endAt } = req.body;
    const createdBy = req.user.id;

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({ 
        success: false,
        message: 'Poll title is required' 
      });
    }

    if (!Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ 
        success: false,
        message: 'Poll must have at least 2 options' 
      });
    }

    if (options.length > 10) {
      return res.status(400).json({ 
        success: false,
        message: 'Poll cannot have more than 10 options' 
      });
    }

    // Filter out empty options and validate
    const validOptions = options
      .filter(option => option && option.trim())
      .map(option => ({ text: option.trim() }));

    if (validOptions.length < 2) {
      return res.status(400).json({ 
        success: false,
        message: 'At least 2 valid options are required' 
      });
    }

    // Create poll object
    const pollData = {
      title: title.trim(),
      options: validOptions,
      createdBy
    };

    // Add optional fields
    if (description && description.trim()) {
      pollData.description = description.trim();
    }

    if (endAt) {
      const endDate = new Date(endAt);
      if (endDate > new Date()) {
        pollData.endAt = endDate;
      }
    }

    // Create poll
    const poll = await Poll.create(pollData);

    // Populate creator information
    await poll.populate('createdBy', 'name email');

    console.log(`New poll created: "${poll.title}" by ${req.user.name}`);

    res.status(201).json({
      success: true,
      message: 'Poll created successfully',
      poll
    });
  } catch (error) {
    console.error('Create poll error:', error.message);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        message: messages.join(', ') 
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Server error creating poll' 
    });
  }
};

// Get all polls
const listPolls = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status = 'all', 
      search = '', 
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};

    // Status filter
    if (status === 'active') {
      query.isActive = true;
      query.$or = [
        { endAt: { $exists: false } },
        { endAt: null },
        { endAt: { $gte: new Date() } }
      ];
    } else if (status === 'inactive') {
      query.$or = [
        { isActive: false },
        { endAt: { $lt: new Date() } }
      ];
    }

    // Search filter
    if (search.trim()) {
      query.$text = { $search: search.trim() };
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Sort options
    const sortOptions = {};
    const validSortFields = ['createdAt', 'title', 'totalVotes', 'updatedAt'];
    if (validSortFields.includes(sortBy)) {
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortOptions.createdAt = -1;
    }

    // Execute query
    const [polls, totalCount] = await Promise.all([
      Poll.find(query)
        .populate('createdBy', 'name')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Poll.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      success: true,
      polls,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('List polls error:', error.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching polls' 
    });
  }
};

// Get a specific poll by ID
const getPoll = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid poll ID' 
      });
    }

    const poll = await Poll.findById(id)
      .populate('createdBy', 'name email')
      .lean();

    if (!poll) {
      return res.status(404).json({ 
        success: false,
        message: 'Poll not found' 
      });
    }

    // Get additional statistics
    const stats = await Vote.getStats(id);
    
    // Check if current user has voted (if authenticated)
    let hasVoted = false;
    if (req.user) {
      hasVoted = await Vote.hasUserVoted(id, req.user.id);
    }

    res.json({
      success: true,
      poll: {
        ...poll,
        stats,
        hasVoted
      }
    });
  } catch (error) {
    console.error('Get poll error:', error.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching poll' 
    });
  }
};

// Update poll (Admin only)
const updatePoll = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, isActive, endAt } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid poll ID' 
      });
    }

    const poll = await Poll.findById(id);
    if (!poll) {
      return res.status(404).json({ 
        success: false,
        message: 'Poll not found' 
      });
    }

    // Check ownership (if not admin)
    if (req.user.role !== 'admin' && poll.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to update this poll' 
      });
    }

    // Update fields
    const updates = {};
    if (title && title.trim()) updates.title = title.trim();
    if (description !== undefined) updates.description = description ? description.trim() : '';
    if (typeof isActive === 'boolean') updates.isActive = isActive;
    if (endAt) {
      const endDate = new Date(endAt);
      if (endDate > new Date()) updates.endAt = endDate;
    }

    const updatedPoll = await Poll.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Poll updated successfully',
      poll: updatedPoll
    });
  } catch (error) {
    console.error('Update poll error:', error.message);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        message: messages.join(', ') 
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Server error updating poll' 
    });
  }
};

// Delete poll (Admin only)
const deletePoll = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid poll ID' 
      });
    }

    const poll = await Poll.findById(id);
    if (!poll) {
      return res.status(404).json({ 
        success: false,
        message: 'Poll not found' 
      });
    }

    // Check ownership (if not admin)
    if (req.user.role !== 'admin' && poll.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to delete this poll' 
      });
    }

    // Delete associated votes first
    await Vote.deleteMany({ pollId: id });
    
    // Delete poll
    await Poll.findByIdAndDelete(id);

    console.log(`Poll deleted: "${poll.title}" by ${req.user.name}`);

    res.json({
      success: true,
      message: 'Poll deleted successfully'
    });
  } catch (error) {
    console.error('Delete poll error:', error.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error deleting poll' 
    });
  }
};

// Get polls created by current user
const getMyPolls = async (req, res) => {
  try {
    const polls = await Poll.find({ createdBy: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    // Get vote counts for each poll
    const pollsWithStats = await Promise.all(
      polls.map(async (poll) => {
        const stats = await Vote.getStats(poll._id);
        return {
          ...poll,
          stats
        };
      })
    );

    res.json({
      success: true,
      polls: pollsWithStats
    });
  } catch (error) {
    console.error('Get my polls error:', error.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching your polls' 
    });
  }
};

module.exports = { 
  createPoll, 
  listPolls, 
  getPoll, 
  updatePoll, 
  deletePoll, 
  getMyPolls 
};