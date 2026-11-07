const express = require('express');
const router = express.Router();
const {
  getDashboardAnalytics,
  getSubjectAnalytics,
  getGoalAnalytics,
  getStudyHoursAnalytics,
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/dashboard', getDashboardAnalytics);
router.get('/subjects', getSubjectAnalytics);
router.get('/goals', getGoalAnalytics);
router.get('/study-hours', getStudyHoursAnalytics);

module.exports = router;
