const { z } = require('zod');

const studyEntrySchema = z.object({
  subjectId: z.string().min(1, 'Subject is required'),
  goalId: z.string().nullable().optional(),
  chapterId: z.string().nullable().optional(),
  topicId: z.string().nullable().optional(),
  durationMinutes: z.number().int().min(1, 'Study duration must be at least 1 minute').max(1440, 'Study duration cannot exceed 24 hours per session'),
  date: z.string().optional(),
  notes: z.string().max(1000).optional().default(''),
});

const studyEntryUpdateSchema = studyEntrySchema.partial();

module.exports = {
  studyEntrySchema,
  studyEntryUpdateSchema,
};
