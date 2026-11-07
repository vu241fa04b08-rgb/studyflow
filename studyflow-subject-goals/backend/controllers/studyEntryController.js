const StudyEntry = require('../models/StudyEntry');
const StudyGoal = require('../models/StudyGoal');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const {
  recalculateGoalProgress,
  calculateSubjectProgress,
} = require('../services/progressService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc    Get all study entries for user with filters & pagination
// @route   GET /api/study-entries
// @access  Private
const getStudyEntries = async (req, res, next) => {
  try {
    const {
      subjectId,
      goalId,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    const query = { userId: req.user.id };

    if (subjectId && subjectId !== 'All') {
      query.subjectId = subjectId;
    }

    if (goalId && goalId !== 'All') {
      query.goalId = goalId;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [total, entries] = await Promise.all([
      StudyEntry.countDocuments(query),
      StudyEntry.find(query)
        .populate('subjectId', 'name code color')
        .populate('goalId', 'title targetHours actualHours')
        .populate('chapterId', 'title')
        .populate('topicId', 'title')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    return successResponse(res, 200, 'Study entries retrieved successfully', entries, {
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      limit: limitNum,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new study entry
// @route   POST /api/study-entries
// @access  Private
const createStudyEntry = async (req, res, next) => {
  try {
    const {
      subjectId,
      goalId,
      chapterId,
      topicId,
      durationMinutes,
      date,
      notes,
    } = req.body;

    // Verify subject ownership
    const subject = await Subject.findOne({
      _id: subjectId,
      userId: req.user.id,
    });

    if (!subject) {
      return errorResponse(res, 404, 'Subject not found or access denied.');
    }

    // If goalId provided, verify ownership
    if (goalId) {
      const goal = await StudyGoal.findOne({
        _id: goalId,
        userId: req.user.id,
      });
      if (!goal) {
        return errorResponse(res, 404, 'Study goal not found or access denied.');
      }
    }

    const entry = await StudyEntry.create({
      userId: req.user.id,
      subjectId,
      goalId: goalId || null,
      chapterId: chapterId || null,
      topicId: topicId || null,
      durationMinutes,
      date: date ? new Date(date) : new Date(),
      notes: notes || '',
    });

    // Update topic actualMinutes if topicId is set
    if (topicId) {
      await Topic.findOneAndUpdate(
        { _id: topicId, userId: req.user.id },
        { $inc: { actualMinutes: durationMinutes } }
      );
    }

    // Recalculate goal progress if goalId was provided
    if (goalId) {
      await recalculateGoalProgress(goalId);
    }

    // Recalculate subject progress
    await calculateSubjectProgress(subjectId);

    const populated = await StudyEntry.findById(entry._id)
      .populate('subjectId', 'name code color')
      .populate('goalId', 'title targetHours actualHours')
      .populate('topicId', 'title');

    return successResponse(res, 201, 'Study session recorded successfully!', populated);
  } catch (err) {
    next(err);
  }
};

// @desc    Update a study entry
// @route   PUT /api/study-entries/:id
// @access  Private
const updateStudyEntry = async (req, res, next) => {
  try {
    const entry = await StudyEntry.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!entry) {
      return errorResponse(res, 404, 'Study entry not found or access denied.');
    }

    const oldDuration = entry.durationMinutes;
    const oldGoalId = entry.goalId;
    const oldTopicId = entry.topicId;

    const {
      durationMinutes,
      date,
      notes,
      goalId,
      topicId,
      chapterId,
    } = req.body;

    if (durationMinutes !== undefined) entry.durationMinutes = durationMinutes;
    if (date !== undefined) entry.date = new Date(date);
    if (notes !== undefined) entry.notes = notes;
    if (goalId !== undefined) entry.goalId = goalId || null;
    if (topicId !== undefined) entry.topicId = topicId || null;
    if (chapterId !== undefined) entry.chapterId = chapterId || null;

    await entry.save();

    // Adjust topic actualMinutes
    if (oldTopicId && durationMinutes !== undefined) {
      const diff = durationMinutes - oldDuration;
      await Topic.findOneAndUpdate(
        { _id: oldTopicId, userId: req.user.id },
        { $inc: { actualMinutes: diff } }
      );
    }

    // Recalculate old and new goal progress if changed
    if (oldGoalId) await recalculateGoalProgress(oldGoalId);
    if (entry.goalId && (!oldGoalId || entry.goalId.toString() !== oldGoalId.toString())) {
      await recalculateGoalProgress(entry.goalId);
    }

    // Recalculate subject progress
    await calculateSubjectProgress(entry.subjectId);

    const updated = await StudyEntry.findById(entry._id)
      .populate('subjectId', 'name code color')
      .populate('goalId', 'title targetHours actualHours')
      .populate('topicId', 'title');

    return successResponse(res, 200, 'Study entry updated successfully', updated);
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a study entry
// @route   DELETE /api/study-entries/:id
// @access  Private
const deleteStudyEntry = async (req, res, next) => {
  try {
    const entry = await StudyEntry.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!entry) {
      return errorResponse(res, 404, 'Study entry not found or access denied.');
    }

    const { goalId, subjectId, topicId, durationMinutes } = entry;

    await StudyEntry.deleteOne({ _id: entry._id });

    // Decrease topic actualMinutes if applicable
    if (topicId) {
      await Topic.findOneAndUpdate(
        { _id: topicId, userId: req.user.id },
        { $inc: { actualMinutes: -durationMinutes } }
      );
    }

    // Recalculate goal progress
    if (goalId) {
      await recalculateGoalProgress(goalId);
    }

    // Recalculate subject progress
    await calculateSubjectProgress(subjectId);

    return successResponse(res, 200, 'Study entry deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStudyEntries,
  createStudyEntry,
  updateStudyEntry,
  deleteStudyEntry,
};
