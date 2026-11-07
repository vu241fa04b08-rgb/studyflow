const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');
const Topic = require('../models/Topic');
const StudyGoal = require('../models/StudyGoal');
const StudyEntry = require('../models/StudyEntry');
const { calculateSubjectProgress } = require('../services/progressService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc    Get all subjects for logged-in user with filters, search, sort, pagination
// @route   GET /api/subjects
// @access  Private
const getSubjects = async (req, res, next) => {
  try {
    const {
      search,
      status,
      category,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = req.query;

    const query = { userId: req.user.id };

    // Search by name or code
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by status
    if (status && status !== 'All') {
      query.status = status;
    }

    // Filter by category
    if (category && category !== 'All') {
      query.category = category;
    }

    // Sorting
    let sort = {};
    if (sortBy === 'name') {
      sort.name = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'targetDate') {
      sort.targetDate = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [total, rawSubjects] = await Promise.all([
      Subject.countDocuments(query),
      Subject.find(query).sort(sort).skip(skip).limit(limitNum),
    ]);

    // Enhance each subject with calculated progress metrics
    const subjectsWithProgress = await Promise.all(
      rawSubjects.map(async (subj) => {
        const metrics = await calculateSubjectProgress(subj._id);
        return {
          ...subj.toObject(),
          ...metrics,
        };
      })
    );

    // If sorting by progress in memory
    if (sortBy === 'progress') {
      subjectsWithProgress.sort((a, b) =>
        sortOrder === 'asc'
          ? a.progressPercentage - b.progressPercentage
          : b.progressPercentage - a.progressPercentage
      );
    }

    return successResponse(res, 200, 'Subjects retrieved successfully', subjectsWithProgress, {
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      limit: limitNum,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single subject by ID
// @route   GET /api/subjects/:id
// @access  Private
const getSubjectById = async (req, res, next) => {
  try {
    const subject = await Subject.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!subject) {
      return errorResponse(res, 404, 'Subject not found or you are not authorized to view it.');
    }

    const metrics = await calculateSubjectProgress(subject._id);
    const chapters = await Chapter.find({
      subjectId: subject._id,
      userId: req.user.id,
    }).sort({ order: 1, createdAt: 1 });

    return successResponse(res, 200, 'Subject retrieved successfully', {
      ...subject.toObject(),
      ...metrics,
      chapters,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new subject
// @route   POST /api/subjects
// @access  Private
const createSubject = async (req, res, next) => {
  try {
    const {
      name,
      code,
      description,
      category,
      color,
      targetDate,
      estimatedHours,
      status,
    } = req.body;

    // Check if subject with same name already exists for this user
    const existingSubject = await Subject.findOne({
      userId: req.user.id,
      name: { $regex: new RegExp(`^${name}$`, 'i') },
    });

    if (existingSubject) {
      return errorResponse(res, 400, `Subject "${name}" already exists in your account.`);
    }

    const subject = await Subject.create({
      userId: req.user.id,
      name,
      code,
      description,
      category,
      color: color || '#6366f1',
      targetDate: targetDate ? new Date(targetDate) : null,
      estimatedHours: estimatedHours || 0,
      status: status || 'Not Started',
    });

    const metrics = await calculateSubjectProgress(subject._id);

    return successResponse(res, 201, 'Subject created successfully', {
      ...subject.toObject(),
      ...metrics,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a subject
// @route   PUT /api/subjects/:id
// @access  Private
const updateSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!subject) {
      return errorResponse(res, 404, 'Subject not found or you are not authorized to edit it.');
    }

    const {
      name,
      code,
      description,
      category,
      color,
      targetDate,
      estimatedHours,
      status,
    } = req.body;

    if (name && name !== subject.name) {
      const duplicate = await Subject.findOne({
        userId: req.user.id,
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: subject._id },
      });
      if (duplicate) {
        return errorResponse(res, 400, `Subject "${name}" already exists in your account.`);
      }
      subject.name = name;
    }

    if (code !== undefined) subject.code = code;
    if (description !== undefined) subject.description = description;
    if (category !== undefined) subject.category = category;
    if (color !== undefined) subject.color = color;
    if (targetDate !== undefined) subject.targetDate = targetDate ? new Date(targetDate) : null;
    if (estimatedHours !== undefined) subject.estimatedHours = estimatedHours;
    if (status !== undefined) subject.status = status;

    await subject.save();

    const metrics = await calculateSubjectProgress(subject._id);

    return successResponse(res, 200, 'Subject updated successfully', {
      ...subject.toObject(),
      ...metrics,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a subject (cascade delete chapters, topics, goals, study entries)
// @route   DELETE /api/subjects/:id
// @access  Private
const deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!subject) {
      return errorResponse(res, 404, 'Subject not found or you are not authorized to delete it.');
    }

    // Cascade cleanups
    await Promise.all([
      Subject.deleteOne({ _id: subject._id }),
      Chapter.deleteMany({ subjectId: subject._id }),
      Topic.deleteMany({ subjectId: subject._id }),
      StudyGoal.deleteMany({ subjectId: subject._id }),
      StudyEntry.deleteMany({ subjectId: subject._id }),
    ]);

    return successResponse(res, 200, 'Subject and all associated chapters, topics, goals, and study entries deleted successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
};
