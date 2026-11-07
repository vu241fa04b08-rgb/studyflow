const StudyGoal = require('../models/StudyGoal');
const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');
const StudyEntry = require('../models/StudyEntry');
const { recalculateGoalProgress } = require('../services/progressService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc    Get all study goals with filters, search, sort, pagination
// @route   GET /api/goals
// @access  Private
const getGoals = async (req, res, next) => {
  try {
    const {
      search,
      subjectId,
      type,
      priority,
      status,
      isOverdue,
      sortBy = 'deadline',
      sortOrder = 'asc',
      page = 1,
      limit = 30,
    } = req.query;

    const query = { userId: req.user.id };

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    if (subjectId && subjectId !== 'All') {
      query.subjectId = subjectId;
    }

    if (type && type !== 'All') {
      query.type = type;
    }

    if (priority && priority !== 'All') {
      query.priority = priority;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (isOverdue === 'true') {
      query.deadline = { $lt: new Date() };
      query.status = { $nin: ['Completed', 'Cancelled'] };
    }

    // Sort definition
    let sort = {};
    if (sortBy === 'deadline') {
      sort.deadline = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'priority') {
      // Custom order handled or standard sort
      sort.priority = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'createdAt') {
      sort.createdAt = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 30;
    const skip = (pageNum - 1) * limitNum;

    const [total, goals] = await Promise.all([
      StudyGoal.countDocuments(query),
      StudyGoal.find(query)
        .populate('subjectId', 'name code color')
        .populate('chapterId', 'title')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
    ]);

    return successResponse(res, 200, 'Goals retrieved successfully', goals, {
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      limit: limitNum,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single study goal by ID
// @route   GET /api/goals/:id
// @access  Private
const getGoalById = async (req, res, next) => {
  try {
    const goal = await StudyGoal.findOne({
      _id: req.params.id,
      userId: req.user.id,
    })
      .populate('subjectId', 'name code color category')
      .populate('chapterId', 'title');

    if (!goal) {
      return errorResponse(res, 404, 'Study goal not found or access denied.');
    }

    // Get all study entries recorded for this goal
    const entries = await StudyEntry.find({
      goalId: goal._id,
      userId: req.user.id,
    })
      .populate('topicId', 'title')
      .sort({ date: -1, createdAt: -1 });

    return successResponse(res, 200, 'Goal details retrieved successfully', {
      ...goal.toObject(),
      entries,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new study goal
// @route   POST /api/goals
// @access  Private
const createGoal = async (req, res, next) => {
  try {
    const {
      subjectId,
      chapterId,
      title,
      description,
      type,
      startDate,
      deadline,
      targetHours,
      priority,
      status,
    } = req.body;

    // Verify subject belongs to user
    const subject = await Subject.findOne({
      _id: subjectId,
      userId: req.user.id,
    });

    if (!subject) {
      return errorResponse(res, 404, 'Specified subject not found or access denied.');
    }

    // If chapterId provided, verify it belongs to user & subject
    if (chapterId) {
      const chapter = await Chapter.findOne({
        _id: chapterId,
        subjectId,
        userId: req.user.id,
      });
      if (!chapter) {
        return errorResponse(res, 400, 'Selected chapter does not belong to this subject.');
      }
    }

    const goal = await StudyGoal.create({
      userId: req.user.id,
      subjectId,
      chapterId: chapterId || null,
      title,
      description: description || '',
      type: type || 'Weekly goal',
      startDate: startDate ? new Date(startDate) : new Date(),
      deadline: new Date(deadline),
      targetHours,
      priority: priority || 'Medium',
      status: status || 'Not Started',
    });

    const populated = await StudyGoal.findById(goal._id)
      .populate('subjectId', 'name code color')
      .populate('chapterId', 'title');

    return successResponse(res, 201, 'Study goal created successfully', populated);
  } catch (err) {
    next(err);
  }
};

// @desc    Update a study goal
// @route   PUT /api/goals/:id
// @access  Private
const updateGoal = async (req, res, next) => {
  try {
    const goal = await StudyGoal.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!goal) {
      return errorResponse(res, 404, 'Goal not found or access denied.');
    }

    const {
      subjectId,
      chapterId,
      title,
      description,
      type,
      startDate,
      deadline,
      targetHours,
      priority,
      status,
    } = req.body;

    if (subjectId && subjectId !== goal.subjectId.toString()) {
      const subject = await Subject.findOne({
        _id: subjectId,
        userId: req.user.id,
      });
      if (!subject) {
        return errorResponse(res, 404, 'Subject not found.');
      }
      goal.subjectId = subjectId;
    }

    if (chapterId !== undefined) {
      goal.chapterId = chapterId || null;
    }

    if (title !== undefined) goal.title = title;
    if (description !== undefined) goal.description = description;
    if (type !== undefined) goal.type = type;
    if (startDate !== undefined) goal.startDate = new Date(startDate);
    if (deadline !== undefined) goal.deadline = new Date(deadline);
    if (targetHours !== undefined) goal.targetHours = targetHours;
    if (priority !== undefined) goal.priority = priority;

    if (status !== undefined && status !== goal.status) {
      goal.status = status;
      goal.completedAt = status === 'Completed' ? new Date() : null;
    }

    await goal.save();

    const updated = await StudyGoal.findById(goal._id)
      .populate('subjectId', 'name code color')
      .populate('chapterId', 'title');

    return successResponse(res, 200, 'Goal updated successfully', updated);
  } catch (err) {
    next(err);
  }
};

// @desc    Quick status change (Complete, Pause, Resume, Cancel)
// @route   PATCH /api/goals/:id/status
// @access  Private
const updateGoalStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const goal = await StudyGoal.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!goal) {
      return errorResponse(res, 404, 'Goal not found or access denied.');
    }

    goal.status = status;
    goal.completedAt = status === 'Completed' ? new Date() : null;
    await goal.save();

    const updated = await StudyGoal.findById(goal._id)
      .populate('subjectId', 'name code color')
      .populate('chapterId', 'title');

    return successResponse(res, 200, `Goal marked as ${status}`, updated);
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a study goal
// @route   DELETE /api/goals/:id
// @access  Private
const deleteGoal = async (req, res, next) => {
  try {
    const goal = await StudyGoal.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!goal) {
      return errorResponse(res, 404, 'Goal not found or access denied.');
    }

    // Set goalId null on associated study entries or delete
    await StudyEntry.updateMany({ goalId: goal._id }, { $set: { goalId: null } });
    await StudyGoal.deleteOne({ _id: goal._id });

    return successResponse(res, 200, 'Study goal deleted successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getGoals,
  getGoalById,
  createGoal,
  updateGoal,
  updateGoalStatus,
  deleteGoal,
};
