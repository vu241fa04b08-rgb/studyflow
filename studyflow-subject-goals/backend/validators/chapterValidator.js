const { z } = require('zod');

const chapterSchema = z.object({
  title: z.string().min(1, 'Chapter title is required').max(150),
  description: z.string().max(1000).optional().default(''),
  order: z.number().int().optional().default(0),
  targetDate: z.string().nullable().optional(),
  status: z.enum(['Not Started', 'In Progress', 'Completed']).optional().default('Not Started'),
});

const chapterUpdateSchema = chapterSchema.partial();

const reorderChaptersSchema = z.object({
  chapters: z.array(
    z.object({
      id: z.string(),
      order: z.number().int(),
    })
  ),
});

module.exports = {
  chapterSchema,
  chapterUpdateSchema,
  reorderChaptersSchema,
};
