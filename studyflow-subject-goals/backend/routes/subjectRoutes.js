const express = require('express');
const router = express.Router();
const {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
} = require('../controllers/subjectController');
const {
  getChaptersBySubject,
  createChapter,
} = require('../controllers/chapterController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validateMiddleware');
const {
  subjectSchema,
  subjectUpdateSchema,
} = require('../validators/subjectValidator');
const { chapterSchema } = require('../validators/chapterValidator');

// Protect all subject routes
router.use(protect);

router
  .route('/')
  .get(getSubjects)
  .post(validate(subjectSchema), createSubject);

router
  .route('/:id')
  .get(getSubjectById)
  .put(validate(subjectUpdateSchema), updateSubject)
  .delete(deleteSubject);

// Nested chapter routes under subject
router
  .route('/:subjectId/chapters')
  .get(getChaptersBySubject)
  .post(validate(chapterSchema), createChapter);

module.exports = router;
