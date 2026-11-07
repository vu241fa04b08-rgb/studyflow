const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Topic must belong to a user'],
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Topic must belong to a subject'],
      index: true,
    },
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter',
      required: [true, 'Topic must belong to a chapter'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a topic title'],
      trim: true,
      maxlength: [150, 'Topic title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    estimatedMinutes: {
      type: Number,
      default: 30,
      min: [0, 'Estimated minutes cannot be negative'],
    },
    actualMinutes: {
      type: Number,
      default: 0,
      min: [0, 'Actual minutes cannot be negative'],
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed'],
      default: 'Not Started',
    },
    completedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

topicSchema.index({ chapterId: 1, status: 1 });
topicSchema.index({ subjectId: 1, status: 1 });
topicSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.models.Topic || mongoose.model('Topic', topicSchema);
