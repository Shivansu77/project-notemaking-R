// Note Model for MongoDB
const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Note title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Note content is required'],
    maxlength: [50000, 'Content cannot exceed 50,000 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Note author is required']
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  category: {
    type: String,
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters'],
    default: 'General'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  metadata: {
    wordCount: {
      type: Number,
      default: 0
    },
    readingTime: {
      type: Number, // in minutes
      default: 0
    },
    lastViewedAt: {
      type: Date,
      default: Date.now
    },
    viewCount: {
      type: Number,
      default: 0
    }
  },
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['read', 'write', 'admin'],
      default: 'read'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  version: {
    type: Number,
    default: 1
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better performance
noteSchema.index({ author: 1, createdAt: -1 });
noteSchema.index({ author: 1, updatedAt: -1 });
noteSchema.index({ isPublic: 1, createdAt: -1 });
noteSchema.index({ tags: 1 });
noteSchema.index({ category: 1 });
noteSchema.index({ title: 'text', content: 'text' }); // Text search index

// Virtual for excerpt
noteSchema.virtual('excerpt').get(function() {
  return this.content.length > 150 
    ? this.content.substring(0, 150) + '...'
    : this.content;
});

// Pre-save middleware to calculate metadata
noteSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    // Calculate word count
    this.metadata.wordCount = this.content.split(/\s+/).filter(word => word.length > 0).length;
    
    // Calculate reading time (average 200 words per minute)
    this.metadata.readingTime = Math.ceil(this.metadata.wordCount / 200);
  }
  
  // Increment version on content changes
  if (this.isModified('content') || this.isModified('title')) {
    this.version += 1;
  }
  
  next();
});

// Instance method to increment view count
noteSchema.methods.incrementView = function() {
  this.metadata.viewCount += 1;
  this.metadata.lastViewedAt = new Date();
  return this.save();
};

// Instance method to add collaborator
noteSchema.methods.addCollaborator = function(userId, permission = 'read') {
  const existingCollaborator = this.collaborators.find(
    collab => collab.user.toString() === userId.toString()
  );
  
  if (existingCollaborator) {
    existingCollaborator.permission = permission;
  } else {
    this.collaborators.push({
      user: userId,
      permission: permission
    });
  }
  
  return this.save();
};

// Instance method to remove collaborator
noteSchema.methods.removeCollaborator = function(userId) {
  this.collaborators = this.collaborators.filter(
    collab => collab.user.toString() !== userId.toString()
  );
  return this.save();
};

// Instance method to soft delete
noteSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Instance method to restore
noteSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = undefined;
  return this.save();
};

// Static method to find notes by user
noteSchema.statics.findByUser = function(userId, options = {}) {
  const query = { 
    author: userId, 
    isDeleted: false 
  };
  
  // Add search filter
  if (options.search) {
    query.$text = { $search: options.search };
  }
  
  // Add category filter
  if (options.category) {
    query.category = options.category;
  }
  
  // Add tag filter
  if (options.tags && options.tags.length > 0) {
    query.tags = { $in: options.tags };
  }
  
  // Add status filter
  if (options.status) {
    query.status = options.status;
  }
  
  let queryBuilder = this.find(query);
  
  // Add sorting
  const sortBy = options.sortBy || 'updatedAt';
  const sortOrder = options.sortOrder === 'asc' ? 1 : -1;
  queryBuilder = queryBuilder.sort({ [sortBy]: sortOrder });
  
  // Add pagination
  if (options.limit) {
    queryBuilder = queryBuilder.limit(parseInt(options.limit));
  }
  
  if (options.skip) {
    queryBuilder = queryBuilder.skip(parseInt(options.skip));
  }
  
  return queryBuilder;
};

// Static method to find public notes
noteSchema.statics.findPublic = function(options = {}) {
  const query = { 
    isPublic: true, 
    isDeleted: false,
    status: 'published'
  };
  
  if (options.search) {
    query.$text = { $search: options.search };
  }
  
  return this.find(query)
    .populate('author', 'username profile.firstName profile.lastName')
    .sort({ updatedAt: -1 })
    .limit(options.limit || 20);
};

// Static method to get user note stats
noteSchema.statics.getUserStats = async function(userId) {
  const totalNotes = await this.countDocuments({ author: userId, isDeleted: false });
  const publicNotes = await this.countDocuments({ author: userId, isPublic: true, isDeleted: false });
  const privateNotes = totalNotes - publicNotes;
  const recentNotes = await this.countDocuments({
    author: userId,
    isDeleted: false,
    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  });
  
  const categories = await this.aggregate([
    { $match: { author: mongoose.Types.ObjectId(userId), isDeleted: false } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  return {
    totalNotes,
    publicNotes,
    privateNotes,
    recentNotes,
    categories
  };
};

module.exports = mongoose.model('Note', noteSchema);
