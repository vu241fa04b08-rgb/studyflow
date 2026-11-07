const { z } = require('zod');

const topicSchema = z.object({
  title: z.string().min(1, 'Topic title is required').max(150),
  description: z.string().max(1000).optional().default(''),
  estimatedMinutes: z.number().min(0, 'Estimated minutes cannot be negative').optional().default(30),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional().default('Medium'),
  status: z.enum(['Not Started', 'In Progress', 'Completed']).optional().default('Not Started'),
  notes: z.string().max(2000).optional().default(''),
});

const topicUpdateSchema = topicSchema.partial();

const topicStatusSchema = z.object({
  status: z.enum(['Not Started', 'In Progress', 'Completed']),
});

module.exports = {
  topicSchema,
  topicUpdateSchema,
  topicStatusSchema,
};
