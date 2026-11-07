const Topic = require('../models/Topic');
const Chapter = require('../models/Chapter');
const Subject = require('../models/Subject');
const {
  calculateChapterProgress,
  calculateSubjectProgress,
} = require('../services/progressService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc    Get all topics for a chapter
// @route   GET /api/chapters/:chapterId/topics
// @access  Private
const getTopicsByChapter = async (req, res, next) => {
  try {
    const { chapterId } = req.params;

    // Verify ownership via chapter
    const chapter = await Chapter.findOne({
      _id: chapterId,
      userId: req.user.id,
    });

    if (!chapter) {
      return errorResponse(res, 404, 'Chapter not found or access denied.');
    }

    const topics = await Topic.find({
      chapterId,
      userId: req.user.id,
    }).sort({ createdAt: 1 });

    return successResponse(res, 200, 'Topics retrieved successfully', topics);
  } catch (err) {
    next(err);
  }
};

// @desc    Create a topic under a chapter
// @route   POST /api/chapters/:chapterId/topics
// @access  Private
const createTopic = async (req, res, next) => {
  try {
    const { chapterId } = req.params;
    const {
      title,
      description,
      estimatedMinutes,
      difficulty,
      status,
      notes,
    } = req.body;

    const chapter = await Chapter.findOne({
      _id: chapterId,
      userId: req.user.id,
    });

    if (!chapter) {
      return errorResponse(res, 404, 'Chapter not found or access denied.');
    }

    const topic = await Topic.create({
      userId: req.user.id,
      subjectId: chapter.subjectId,
      chapterId,
      title,
      description: description || '',
      estimatedMinutes: estimatedMinutes || 30,
      difficulty: difficulty || 'Medium',
      status: status || 'Not Started',
      completedAt: status === 'Completed' ? new Date() : null,
      notes: notes || '',
    });

    // Recalculate progress for both chapter and subject
    const [chapterProgress, subjectProgress] = await Promise.all([
      calculateChapterProgress(chapterId),
      calculateSubjectProgress(chapter.subjectId),
    ]);

    return successResponse(res, 201, 'Topic created successfully', {
      topic,
      chapterProgress,
      subjectProgress,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a topic
// @route   PUT /api/topics/:id
// @access  Private
const updateTopic = async (req, res, next) => {
  try {
    const topic = await Topic.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!topic) {
      return errorResponse(res, 404, 'Topic not found or access denied.');
    }

    const {
      title,
      description,
      estimatedMinutes,
      actualMinutes,
      difficulty,
      status,
      notes,
    } = req.body;

    if (title !== undefined) topic.title = title;
    if (description !== undefined) topic.description = description;
    if (estimatedMinutes !== undefined) topic.estimatedMinutes = estimatedMinutes;
    if (actualMinutes !== undefined) topic.actualMinutes = actualMinutes;
    if (difficulty !== undefined) topic.difficulty = difficulty;
    if (notes !== undefined) topic.notes = notes;

    if (status !== undefined && status !== topic.status) {
      topic.status = status;
      topic.completedAt = status === 'Completed' ? new Date() : null;
    }

    await topic.save();

    // Recalculate progress
    const [chapterProgress, subjectProgress] = await Promise.all([
      calculateChapterProgress(topic.chapterId),
      calculateSubjectProgress(topic.subjectId),
    ]);

    return successResponse(res, 200, 'Topic updated successfully', {
      topic,
      chapterProgress,
      subjectProgress,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Quick toggle / patch topic status
// @route   PATCH /api/topics/:id/status
// @access  Private
const updateTopicStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const topic = await Topic.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!topic) {
      return errorResponse(res, 404, 'Topic not found or access denied.');
    }

    topic.status = status;
    topic.completedAt = status === 'Completed' ? new Date() : null;
    await topic.save();

    // Recalculate progress
    const [chapterProgress, subjectProgress] = await Promise.all([
      calculateChapterProgress(topic.chapterId),
      calculateSubjectProgress(topic.subjectId),
    ]);

    return successResponse(res, 200, 'Topic status updated successfully', {
      topic,
      chapterProgress,
      subjectProgress,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a topic
// @route   DELETE /api/topics/:id
// @access  Private
const deleteTopic = async (req, res, next) => {
  try {
    const topic = await Topic.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!topic) {
      return errorResponse(res, 404, 'Topic not found or access denied.');
    }

    const { chapterId, subjectId } = topic;

    await Topic.deleteOne({ _id: topic._id });

    // Recalculate progress
    const [chapterProgress, subjectProgress] = await Promise.all([
      calculateChapterProgress(chapterId),
      calculateSubjectProgress(subjectId),
    ]);

    return successResponse(res, 200, 'Topic deleted successfully', {
      chapterProgress,
      subjectProgress,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTopicsByChapter,
  createTopic,
  updateTopic,
  updateTopicStatus,
  deleteTopic,
};
