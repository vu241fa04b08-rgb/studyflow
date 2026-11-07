const express = require('express');
const router = express.Router();
const {
  updateTopic,
  updateTopicStatus,
  deleteTopic,
} = require('../controllers/topicController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validateMiddleware');
const {
  topicUpdateSchema,
  topicStatusSchema,
} = require('../validators/topicValidator');

router.use(protect);

router
  .route('/:id')
  .put(validate(topicUpdateSchema), updateTopic)
  .delete(deleteTopic);

router.patch('/:id/status', validate(topicStatusSchema), updateTopicStatus);

module.exports = router;
