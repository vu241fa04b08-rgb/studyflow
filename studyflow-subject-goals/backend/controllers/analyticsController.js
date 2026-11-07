const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');
const Topic = require('../models/Topic');
const StudyGoal = require('../models/StudyGoal');
const StudyEntry = require('../models/StudyEntry');
const { calculateSubjectProgress } = require('../services/progressService');
const { successResponse } = require('../utils/apiResponse');

// @desc    Get comprehensive dashboard analytics
// @route   GET /api/analytics/dashboard
// @access  Private
const getDashboardAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // 1. Subject Counts
    const [totalSubjects, activeSubjects, completedSubjects, subjects] = await Promise.all([
      Subject.countDocuments({ userId }),
      Subject.countDocuments({ userId, status: 'In Progress' }),
      Subject.countDocuments({ userId, status: 'Completed' }),
      Subject.find({ userId }).sort({ updatedAt: -1 }),
    ]);

    // 2. Goal Counts
    const [totalGoals, completedGoals, pendingGoals, overdueGoals] = await Promise.all([
      StudyGoal.countDocuments({ userId }),
      StudyGoal.countDocuments({ userId, status: 'Completed' }),
      StudyGoal.countDocuments({ userId, status: { $in: ['Not Started', 'In Progress'] } }),
      StudyGoal.countDocuments({
        userId,
        status: { $nin: ['Completed', 'Cancelled'] },
        deadline: { $lt: now },
      }),
    ]);

    // 3. Study Hours (Total estimated from subjects & actual from study entries)
    const estimatedHoursSum = subjects.reduce((sum, s) => sum + (s.estimatedHours || 0), 0);

    const studyEntries = await StudyEntry.find({ userId });
    const actualMinutesSum = studyEntries.reduce(
      (sum, e) => sum + (e.durationMinutes || 0),
      0
    );
    const actualHoursTotal = +(actualMinutesSum / 60).toFixed(1);

    // 4. Today's Goals (due today or active today)
    const todaysGoals = await StudyGoal.find({
      userId,
      deadline: { $gte: startOfToday, $lte: endOfToday },
    })
      .populate('subjectId', 'name code color')
      .sort({ priority: -1, deadline: 1 });

    // 5. Upcoming Goals (due in next 7 days, excluding completed)
    const upcomingGoals = await StudyGoal.find({
      userId,
      deadline: { $gt: endOfToday, $lte: in7Days },
      status: { $ne: 'Completed' },
    })
      .populate('subjectId', 'name code color')
      .sort({ deadline: 1 });

    // 6. Pending / Active Goals (limit 6)
    const activeGoals = await StudyGoal.find({
      userId,
      status: { $in: ['Not Started', 'In Progress'] },
    })
      .populate('subjectId', 'name code color')
      .sort({ deadline: 1 })
      .limit(6);

    // 7. Recent Activity (Recent subjects, goals, study entries)
    const [recentSubjects, recentGoals, recentEntries] = await Promise.all([
      Subject.find({ userId }).sort({ createdAt: -1 }).limit(3),
      StudyGoal.find({ userId }).populate('subjectId', 'name color').sort({ createdAt: -1 }).limit(3),
      StudyEntry.find({ userId })
        .populate('subjectId', 'name color')
        .populate('goalId', 'title')
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    // 8. Subject Progress List (for cards & charts)
    const subjectProgressList = await Promise.all(
      subjects.map(async (subj) => {
        const metrics = await calculateSubjectProgress(subj._id);
        return {
          id: subj._id,
          name: subj.name,
          code: subj.code,
          color: subj.color,
          status: subj.status,
          estimatedHours: subj.estimatedHours,
          ...metrics,
        };
      })
    );

    // 9. Study Hours by Day (Last 7 Days)
    const last7DaysData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });

      const dayMinutes = studyEntries
        .filter((e) => new Date(e.date) >= dayStart && new Date(e.date) <= dayEnd)
        .reduce((sum, e) => sum + (e.durationMinutes || 0), 0);

      last7DaysData.push({
        day: dayLabel,
        hours: +(dayMinutes / 60).toFixed(1),
        minutes: dayMinutes,
      });
    }

    // 10. Goals Breakdown by Priority & Status
    const goalsByPriority = {
      Urgent: await StudyGoal.countDocuments({ userId, priority: 'Urgent' }),
      High: await StudyGoal.countDocuments({ userId, priority: 'High' }),
      Medium: await StudyGoal.countDocuments({ userId, priority: 'Medium' }),
      Low: await StudyGoal.countDocuments({ userId, priority: 'Low' }),
    };

    const goalsByStatus = {
      Completed: completedGoals,
      InProgress: activeSubjects,
      NotStarted: await StudyGoal.countDocuments({ userId, status: 'Not Started' }),
      Paused: await StudyGoal.countDocuments({ userId, status: 'Paused' }),
    };

    return successResponse(res, 200, 'Dashboard analytics retrieved successfully', {
      summary: {
        totalSubjects,
        activeSubjects,
        completedSubjects,
        totalGoals,
        completedGoals,
        pendingGoals,
        overdueGoals,
        estimatedHours: estimatedHoursSum,
        actualHours: actualHoursTotal,
      },
      todaysGoals,
      upcomingGoals,
      activeGoals,
      recentActivity: {
        recentSubjects,
        recentGoals,
        recentEntries,
      },
      subjectProgress: subjectProgressList,
      weeklyStudyHours: last7DaysData,
      goalsByPriority,
      goalsByStatus,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get subject analytics
// @route   GET /api/analytics/subjects
// @access  Private
const getSubjectAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const subjects = await Subject.find({ userId });

    const data = await Promise.all(
      subjects.map(async (subj) => {
        const metrics = await calculateSubjectProgress(subj._id);
        return {
          id: subj._id,
          name: subj.name,
          code: subj.code,
          category: subj.category,
          color: subj.color,
          status: subj.status,
          estimatedHours: subj.estimatedHours,
          ...metrics,
        };
      })
    );

    return successResponse(res, 200, 'Subject analytics retrieved', data);
  } catch (err) {
    next(err);
  }
};

// @desc    Get goal analytics
// @route   GET /api/analytics/goals
// @access  Private
const getGoalAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const goals = await StudyGoal.find({ userId }).populate('subjectId', 'name color');

    const total = goals.length;
    const completed = goals.filter((g) => g.status === 'Completed').length;
    const inProgress = goals.filter((g) => g.status === 'In Progress').length;
    const notStarted = goals.filter((g) => g.status === 'Not Started').length;
    const overdue = goals.filter((g) => g.isOverdue).length;

    const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

    return successResponse(res, 200, 'Goal analytics retrieved', {
      total,
      completed,
      inProgress,
      notStarted,
      overdue,
      completionRate,
      goals,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get study hours breakdown
// @route   GET /api/analytics/study-hours
// @access  Private
const getStudyHoursAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const entries = await StudyEntry.find({ userId })
      .populate('subjectId', 'name color')
      .sort({ date: 1 });

    // Group by Subject
    const hoursBySubject = {};
    entries.forEach((e) => {
      const subjName = e.subjectId ? e.subjectId.name : 'Unknown';
      const color = e.subjectId ? e.subjectId.color : '#6366f1';
      if (!hoursBySubject[subjName]) {
        hoursBySubject[subjName] = { name: subjName, hours: 0, color };
      }
      hoursBySubject[subjName].hours += +(e.durationMinutes / 60);
    });

    // Format to 2 decimal places
    const subjectHoursChart = Object.values(hoursBySubject).map((item) => ({
      ...item,
      hours: +item.hours.toFixed(1),
    }));

    return successResponse(res, 200, 'Study hours analytics retrieved', {
      totalEntries: entries.length,
      hoursBySubject: subjectHoursChart,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardAnalytics,
  getSubjectAnalytics,
  getGoalAnalytics,
  getStudyHoursAnalytics,
};
