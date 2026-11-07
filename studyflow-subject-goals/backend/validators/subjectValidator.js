const { z } = require('zod');

const subjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required').max(120),
  code: z.string().max(20).optional().default(''),
  description: z.string().max(1000).optional().default(''),
  category: z.string().min(1, 'Subject category is required'),
  color: z.string().optional().default('#6366f1'),
  targetDate: z.string().nullable().optional(),
  estimatedHours: z.number().min(0, 'Estimated hours must be at least 0').optional().default(0),
  status: z.enum(['Not Started', 'In Progress', 'Completed', 'On Hold']).optional().default('Not Started'),
});

const subjectUpdateSchema = subjectSchema.partial();

module.exports = {
  subjectSchema,
  subjectUpdateSchema,
};
