const express = require('express');
const router = express.Router();
const {
  getChapterById,
  updateChapter,
  deleteChapter,
  reorderChapters,
} = require('../controllers/chapterController');
const {
  getTopicsByChapter,
  createTopic,
} = require('../controllers/topicController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validateMiddleware');
const {
  chapterUpdateSchema,
  reorderChaptersSchema,
} = require('../validators/chapterValidator');
const { topicSchema } = require('../validators/topicValidator');

router.use(protect);

router.put('/reorder', validate(reorderChaptersSchema), reorderChapters);

router
  .route('/:id')
  .get(getChapterById)
  .put(validate(chapterUpdateSchema), updateChapter)
  .delete(deleteChapter);

// Nested topic routes under chapter
router
  .route('/:chapterId/topics')
  .get(getTopicsByChapter)
  .post(validate(topicSchema), createTopic);

module.exports = router;
