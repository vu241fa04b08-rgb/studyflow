const mongoose = require('mongoose');

const studyEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Study entry must belong to a user'],
      index: true,
    },
    goalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyGoal',
      default: null,
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Study entry must be associated with a subject'],
      index: true,
    },
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter',
      default: null,
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      default: null,
    },
    date: {
      type: Date,
      default: Date.now,
      required: [true, 'Please provide the study entry date'],
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Please provide the study duration in minutes'],
      min: [1, 'Study duration must be at least 1 minute'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for duration in hours
studyEntrySchema.virtual('durationHours').get(function () {
  return +(this.durationMinutes / 60).toFixed(2);
});

studyEntrySchema.index({ userId: 1, date: -1 });
studyEntrySchema.index({ goalId: 1, date: -1 });
studyEntrySchema.index({ subjectId: 1, date: -1 });

module.exports = mongoose.models.StudyEntry || mongoose.model('StudyEntry', studyEntrySchema);
