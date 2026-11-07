const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Chapter must belong to a user'],
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Chapter must belong to a subject'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a chapter title'],
      trim: true,
      maxlength: [150, 'Chapter title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    order: {
      type: Number,
      default: 0,
    },
    targetDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed'],
      default: 'Not Started',
    },
  },
  {
    timestamps: true,
  }
);

chapterSchema.index({ subjectId: 1, order: 1 });
chapterSchema.index({ userId: 1, subjectId: 1 });

module.exports = mongoose.models.Chapter || mongoose.model('Chapter', chapterSchema);
