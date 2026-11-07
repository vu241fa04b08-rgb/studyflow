const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Subject must belong to a user'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a subject name'],
      trim: true,
      maxlength: [120, 'Subject name cannot exceed 120 characters'],
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: [20, 'Subject code cannot exceed 20 characters'],
      default: '',
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    category: {
      type: String,
      required: [true, 'Please provide a category'],
      trim: true,
      default: 'General',
    },
    color: {
      type: String,
      default: '#6366f1',
    },
    targetDate: {
      type: Date,
      default: null,
    },
    estimatedHours: {
      type: Number,
      default: 0,
      min: [0, 'Estimated hours cannot be negative'],
    },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed', 'On Hold'],
      default: 'Not Started',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user and subject name
subjectSchema.index({ userId: 1, name: 1 });
subjectSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.models.Subject || mongoose.model('Subject', subjectSchema);
