const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');
const Topic = require('../models/Topic');
const StudyGoal = require('../models/StudyGoal');
const StudyEntry = require('../models/StudyEntry');

/**
 * Calculates progress for a specific chapter
 * @param {string|ObjectId} chapterId
 * @returns {Promise<{ totalTopics: number, completedTopics: number, progressPercentage: number }>}
 */
/**
 * Calculates progress for a specific chapter
 * @param {string|ObjectId} chapterId
 * @returns {Promise<{ totalTopics: number, completedTopics: number, progressPercentage: number }>}
 */
const calculateChapterProgress = async (chapterId) => {
  const chapter = await Chapter.findById(chapterId);
  const totalTopics = await Topic.countDocuments({ chapterId });

  if (chapter && chapter.status === 'Completed') {
    return { totalTopics, completedTopics: totalTopics, progressPercentage: 100 };
  }

  if (totalTopics === 0) {
    return { totalTopics: 0, completedTopics: 0, progressPercentage: 0 };
  }

  const completedTopics = await Topic.countDocuments({
    chapterId,
    status: 'Completed',
  });
  const progressPercentage = Math.round((completedTopics / totalTopics) * 100);

  // Update chapter status automatically if needed
  let status = chapter ? chapter.status : 'Not Started';
  if (completedTopics === totalTopics && totalTopics > 0) {
    status = 'Completed';
  } else if (completedTopics > 0 && status === 'Not Started') {
    status = 'In Progress';
  }

  if (chapter && chapter.status !== status) {
    await Chapter.findByIdAndUpdate(chapterId, { status });
  }

  return { totalTopics, completedTopics, progressPercentage };
};

/**
 * Calculates progress and study hours for a specific subject
 * @param {string|ObjectId} subjectId
 * @returns {Promise<{ totalChapters: number, totalTopics: number, completedTopics: number, pendingTopics: number, progressPercentage: number, completedStudyHours: number }>}
 */
const calculateSubjectProgress = async (subjectId) => {
  const [subject, totalChapters, totalTopics, completedTopics] = await Promise.all([
    Subject.findById(subjectId),
    Chapter.countDocuments({ subjectId }),
    Topic.countDocuments({ subjectId }),
    Topic.countDocuments({ subjectId, status: 'Completed' }),
  ]);

  const pendingTopics = totalTopics - completedTopics;

  // Calculate actual hours logged from study entries for this subject
  const studyEntries = await StudyEntry.find({ subjectId });
  const totalMinutes = studyEntries.reduce(
    (sum, entry) => sum + (entry.durationMinutes || 0),
    0
  );
  const completedStudyHours = +(totalMinutes / 60).toFixed(1);

  let progressPercentage = 0;

  if (subject && subject.status === 'Completed') {
    progressPercentage = 100;
  } else if (totalTopics > 0) {
    progressPercentage = Math.round((completedTopics / totalTopics) * 100);
    if (progressPercentage >= 100 && subject && subject.status !== 'Completed' && subject.status !== 'On Hold') {
      subject.status = 'Completed';
      await subject.save();
    } else if (completedTopics > 0 && subject && subject.status === 'Not Started') {
      subject.status = 'In Progress';
      await subject.save();
    }
  } else if (subject && subject.estimatedHours > 0 && completedStudyHours > 0) {
    // If no topics defined yet, calculate progress based on logged study hours vs estimated hours
    progressPercentage = Math.min(
      100,
      Math.round((completedStudyHours / subject.estimatedHours) * 100)
    );
    if (progressPercentage >= 100 && subject.status !== 'Completed' && subject.status !== 'On Hold') {
      subject.status = 'Completed';
      await subject.save();
    } else if (completedStudyHours > 0 && subject.status === 'Not Started') {
      subject.status = 'In Progress';
      await subject.save();
    }
  } else if (completedStudyHours > 0 && subject && subject.status === 'Not Started') {
    subject.status = 'In Progress';
    await subject.save();
  }

  return {
    totalChapters,
    totalTopics,
    completedTopics,
    pendingTopics,
    progressPercentage,
    completedStudyHours,
  };
};

/**
 * Recalculates actual study hours and completion state for a goal
 * @param {string|ObjectId} goalId
 */
const recalculateGoalProgress = async (goalId) => {
  if (!goalId) return null;

  const entries = await StudyEntry.find({ goalId });
  const totalMinutes = entries.reduce(
    (sum, entry) => sum + (entry.durationMinutes || 0),
    0
  );
  const actualHours = +(totalMinutes / 60).toFixed(2);

  const goal = await StudyGoal.findById(goalId);
  if (!goal) return null;

  goal.actualHours = actualHours;

  // If actualHours reach or exceed targetHours, automatically mark Completed
  if (actualHours >= goal.targetHours && goal.status !== 'Completed') {
    goal.status = 'Completed';
    goal.completedAt = new Date();
  } else if (actualHours > 0 && goal.status === 'Not Started') {
    goal.status = 'In Progress';
  }

  await goal.save();
  return goal;
};

module.exports = {
  calculateChapterProgress,
  calculateSubjectProgress,
  recalculateGoalProgress,
};
