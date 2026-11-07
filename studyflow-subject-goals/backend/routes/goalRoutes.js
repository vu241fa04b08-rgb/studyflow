const express = require('express');
const router = express.Router();
const {
  getGoals,
  getGoalById,
  createGoal,
  updateGoal,
  updateGoalStatus,
  deleteGoal,
} = require('../controllers/goalController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validateMiddleware');
const {
  goalSchema,
  goalUpdateSchema,
  goalStatusSchema,
} = require('../validators/goalValidator');

router.use(protect);

router
  .route('/')
  .get(getGoals)
  .post(validate(goalSchema), createGoal);

router
  .route('/:id')
  .get(getGoalById)
  .put(validate(goalUpdateSchema), updateGoal)
  .delete(deleteGoal);

router.patch('/:id/status', validate(goalStatusSchema), updateGoalStatus);

module.exports = router;
