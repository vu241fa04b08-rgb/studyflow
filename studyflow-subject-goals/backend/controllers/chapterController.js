const Chapter = require('../models/Chapter');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const { calculateChapterProgress, calculateSubjectProgress } = require('../services/progressService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc    Get all chapters for a subject
// @route   GET /api/subjects/:subjectId/chapters
// @access  Private
const getChaptersBySubject = async (req, res, next) => {
  try {
    const { subjectId } = req.params;

    // Verify subject ownership
    const subject = await Subject.findOne({
      _id: subjectId,
      userId: req.user.id,
    });

    if (!subject) {
      return errorResponse(res, 404, 'Subject not found or access denied.');
    }

    const chapters = await Chapter.find({
      subjectId,
      userId: req.user.id,
    }).sort({ order: 1, createdAt: 1 });

    const chaptersWithProgress = await Promise.all(
      chapters.map(async (chap) => {
        const progress = await calculateChapterProgress(chap._id);
        const topics = await Topic.find({ chapterId: chap._id, userId: req.user.id });
        return {
          ...chap.toObject(),
          ...progress,
          topics,
        };
      })
    );

    return successResponse(res, 200, 'Chapters retrieved successfully', chaptersWithProgress);
  } catch (err) {
    next(err);
  }
};

// @desc    Get single chapter details
// @route   GET /api/chapters/:id
// @access  Private
const getChapterById = async (req, res, next) => {
  try {
    const chapter = await Chapter.findOne({
      _id: req.params.id,
      userId: req.user.id,
    }).populate('subjectId', 'name code color');

    if (!chapter) {
      return errorResponse(res, 404, 'Chapter not found or access denied.');
    }

    const progress = await calculateChapterProgress(chapter._id);
    const topics = await Topic.find({ chapterId: chapter._id, userId: req.user.id }).sort({ createdAt: 1 });

    return successResponse(res, 200, 'Chapter details retrieved', {
      ...chapter.toObject(),
      ...progress,
      topics,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a chapter for a subject
// @route   POST /api/subjects/:subjectId/chapters
// @access  Private
const createChapter = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const { title, description, order, targetDate, status } = req.body;

    const subject = await Subject.findOne({
      _id: subjectId,
      userId: req.user.id,
    });

    if (!subject) {
      return errorResponse(res, 404, 'Subject not found or access denied.');
    }

    // Default order to highest + 1 if not explicitly provided
    let chapterOrder = order;
    if (chapterOrder === undefined) {
      const highestOrder = await Chapter.findOne({ subjectId }).sort('-order');
      chapterOrder = highestOrder ? highestOrder.order + 1 : 0;
    }

    const chapter = await Chapter.create({
      userId: req.user.id,
      subjectId,
      title,
      description: description || '',
      order: chapterOrder,
      targetDate: targetDate ? new Date(targetDate) : null,
      status: status || 'Not Started',
    });

    // Update subject progress
    await calculateSubjectProgress(subjectId);

    return successResponse(res, 201, 'Chapter created successfully', {
      ...chapter.toObject(),
      totalTopics: 0,
      completedTopics: 0,
      progressPercentage: 0,
      topics: [],
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a chapter
// @route   PUT /api/chapters/:id
// @access  Private
const updateChapter = async (req, res, next) => {
  try {
    const chapter = await Chapter.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!chapter) {
      return errorResponse(res, 404, 'Chapter not found or access denied.');
    }

    const { title, description, order, targetDate, status } = req.body;

    if (title !== undefined) chapter.title = title;
    if (description !== undefined) chapter.description = description;
    if (order !== undefined) chapter.order = order;
    if (targetDate !== undefined) chapter.targetDate = targetDate ? new Date(targetDate) : null;
    if (status !== undefined) chapter.status = status;

    await chapter.save();
    const progress = await calculateChapterProgress(chapter._id);

    return successResponse(res, 200, 'Chapter updated successfully', {
      ...chapter.toObject(),
      ...progress,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a chapter (cascade topics)
// @route   DELETE /api/chapters/:id
// @access  Private
const deleteChapter = async (req, res, next) => {
  try {
    const chapter = await Chapter.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!chapter) {
      return errorResponse(res, 404, 'Chapter not found or access denied.');
    }

    const subjectId = chapter.subjectId;

    await Promise.all([
      Chapter.deleteOne({ _id: chapter._id }),
      Topic.deleteMany({ chapterId: chapter._id }),
    ]);

    // Recalculate subject progress
    await calculateSubjectProgress(subjectId);

    return successResponse(res, 200, 'Chapter and associated topics deleted successfully.');
  } catch (err) {
    next(err);
  }
};

// @desc    Reorder chapters
// @route   PUT /api/chapters/reorder
// @access  Private
const reorderChapters = async (req, res, next) => {
  try {
    const { chapters } = req.body; // array of { id, order }

    const updatePromises = chapters.map((item) =>
      Chapter.updateOne(
        { _id: item.id, userId: req.user.id },
        { $set: { order: item.order } }
      )
    );

    await Promise.all(updatePromises);
    return successResponse(res, 200, 'Chapters reordered successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getChaptersBySubject,
  getChapterById,
  createChapter,
  updateChapter,
  deleteChapter,
  reorderChapters,
};
