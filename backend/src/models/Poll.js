// backend/src/models/Poll.js
const mongoose = require('mongoose');

const OptionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Option text is required'],
    trim: true,
    maxlength: [200, 'Option text cannot exceed 200 characters']
  },
  votes: {
    type: Number,
    default: 0,
    min: [0, 'Votes cannot be negative']
  }
}, {
  _id: true // Ensure each option has an _id
});

const PollSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Poll title is required'],
    trim: true,
    maxlength: [300, 'Title cannot exceed 300 characters'],
    minlength: [3, 'Title must be at least 3 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  options: {
    type: [OptionSchema],
    required: [true, 'Poll must have options'],
    validate: {
      validator: function(options) {
        return options && options.length >= 2 && options.length <= 10;
      },
      message: 'Poll must have between 2 and 10 options'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startAt: {
    type: Date,
    default: Date.now
  },
  endAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Poll must have a creator']
  },
  totalVotes: {
    type: Number,
    default: 0,
    min: 0
  },
  allowMultipleVotes: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
PollSchema.index({ createdBy: 1 });
PollSchema.index({ isActive: 1 });
PollSchema.index({ createdAt: -1 });
PollSchema.index({ title: 'text', description: 'text' }); // Text search
PollSchema.index({ 'options.votes': -1 }); // Sort by votes

// Virtual for total votes calculation
PollSchema.virtual('calculatedTotalVotes').get(function() {
  return this.options.reduce((total, option) => total + option.votes, 0);
});

// Virtual for poll status
PollSchema.virtual('status').get(function() {
  const now = new Date();
  if (!this.isActive) return 'inactive';
  if (this.endAt && now > this.endAt) return 'ended';
  if (this.startAt && now < this.startAt) return 'upcoming';
  return 'active';
});

// Virtual for most voted option
PollSchema.virtual('leadingOption').get(function() {
  if (!this.options || this.options.length === 0) return null;
  return this.options.reduce((prev, current) => 
    (prev.votes > current.votes) ? prev : current
  );
});

// Pre-save middleware to update total votes
PollSchema.pre('save', function(next) {
  if (this.isModified('options')) {
    this.totalVotes = this.calculatedTotalVotes;
  }
  if (this.isModified() && !this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

// Static method to find active polls
PollSchema.statics.findActive = function() {
  return this.find({ 
    isActive: true,
    $or: [
      { endAt: { $exists: false } },
      { endAt: null },
      { endAt: { $gte: new Date() } }
    ]
  });
};

// Static method to find polls by creator
PollSchema.statics.findByCreator = function(userId) {
  return this.find({ createdBy: userId }).populate('createdBy', 'name email');
};

// Instance method to add vote to option
PollSchema.methods.addVote = function(optionId) {
  const option = this.options.id(optionId);
  if (!option) {
    throw new Error('Option not found');
  }
  
  option.votes += 1;
  this.totalVotes = this.calculatedTotalVotes;
  
  return this.save();
};

// Instance method to check if poll is voteable
PollSchema.methods.canVote = function() {
  const now = new Date();
  return this.isActive && 
         (!this.endAt || now <= this.endAt) &&
         (!this.startAt || now >= this.startAt);
};

// Instance method to get poll statistics
PollSchema.methods.getStats = function() {
  const totalVotes = this.calculatedTotalVotes;
  const optionsWithPercentage = this.options.map(option => ({
    _id: option._id,
    text: option.text,
    votes: option.votes,
    percentage: totalVotes > 0 ? ((option.votes / totalVotes) * 100).toFixed(2) : 0
  }));

  return {
    totalVotes,
    optionsCount: this.options.length,
    options: optionsWithPercentage,
    leadingOption: this.leadingOption,
    status: this.status
  };
};

module.exports = mongoose.model('Poll', PollSchema);