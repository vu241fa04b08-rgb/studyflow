const express = require('express');
const router = express.Router();
const {
  getStudyEntries,
  createStudyEntry,
  updateStudyEntry,
  deleteStudyEntry,
} = require('../controllers/studyEntryController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validateMiddleware');
const {
  studyEntrySchema,
  studyEntryUpdateSchema,
} = require('../validators/studyEntryValidator');

router.use(protect);

router
  .route('/')
  .get(getStudyEntries)
  .post(validate(studyEntrySchema), createStudyEntry);

router
  .route('/:id')
  .put(validate(studyEntryUpdateSchema), updateStudyEntry)
  .delete(deleteStudyEntry);

module.exports = router;
