const mongoose = require('mongoose');

const studyGoalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Goal must belong to a user'],
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Goal must be associated with a subject'],
      index: true,
    },
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter',
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a goal title'],
      trim: true,
      maxlength: [150, 'Goal title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Goal description cannot exceed 1000 characters'],
      default: '',
    },
    type: {
      type: String,
      enum: [
        'Daily goal',
        'Weekly goal',
        'Monthly goal',
        'Subject completion goal',
        'Chapter completion goal',
        'Exam preparation goal',
        'Custom goal',
      ],
      default: 'Weekly goal',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    deadline: {
      type: Date,
      required: [true, 'Please provide a deadline for the goal'],
    },
    targetHours: {
      type: Number,
      required: [true, 'Please provide target study hours'],
      min: [0.1, 'Target study hours must be at least 0.1 hour'],
    },
    actualHours: {
      type: Number,
      default: 0,
      min: [0, 'Actual hours cannot be negative'],
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed', 'Paused', 'Cancelled'],
      default: 'Not Started',
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for progress percentage (capped at 100% for display)
studyGoalSchema.virtual('progressPercentage').get(function () {
  if (this.status === 'Completed') return 100;
  if (!this.targetHours || this.targetHours <= 0) return 0;
  const pct = Math.round((this.actualHours / this.targetHours) * 100);
  return Math.min(100, Math.max(0, pct));
});

// Virtual for isOverdue
studyGoalSchema.virtual('isOverdue').get(function () {
  if (this.status === 'Completed' || this.status === 'Cancelled') return false;
  return new Date() > new Date(this.deadline);
});

// Virtual for remainingDays
studyGoalSchema.virtual('remainingDays').get(function () {
  const diffTime = new Date(this.deadline) - new Date();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

studyGoalSchema.index({ userId: 1, status: 1 });
studyGoalSchema.index({ userId: 1, deadline: 1 });
studyGoalSchema.index({ userId: 1, priority: 1 });

module.exports = mongoose.models.StudyGoal || mongoose.model('StudyGoal', studyGoalSchema);
