const { z } = require('zod');

const goalSchema = z
  .object({
    subjectId: z.string().min(1, 'Subject is required'),
    chapterId: z.string().nullable().optional(),
    title: z.string().min(1, 'Goal title is required').max(150),
    description: z.string().max(1000).optional().default(''),
    type: z.enum([
      'Daily goal',
      'Weekly goal',
      'Monthly goal',
      'Subject completion goal',
      'Chapter completion goal',
      'Exam preparation goal',
      'Custom goal',
    ]).default('Weekly goal'),
    startDate: z.string().optional(),
    deadline: z.string().min(1, 'Goal deadline is required'),
    targetHours: z.number().min(0.1, 'Target study hours must be at least 0.1 hour'),
    priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).default('Medium'),
    status: z.enum(['Not Started', 'In Progress', 'Completed', 'Paused', 'Cancelled']).default('Not Started'),
  })
  .refine(
    (data) => {
      if (data.startDate && data.deadline) {
        return new Date(data.deadline) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: 'Goal deadline cannot be before the start date',
      path: ['deadline'],
    }
  );

const goalUpdateSchema = z
  .object({
    subjectId: z.string().optional(),
    chapterId: z.string().nullable().optional(),
    title: z.string().min(1).max(150).optional(),
    description: z.string().max(1000).optional(),
    type: z.enum([
      'Daily goal',
      'Weekly goal',
      'Monthly goal',
      'Subject completion goal',
      'Chapter completion goal',
      'Exam preparation goal',
      'Custom goal',
    ]).optional(),
    startDate: z.string().optional(),
    deadline: z.string().optional(),
    targetHours: z.number().min(0.1).optional(),
    priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional(),
    status: z.enum(['Not Started', 'In Progress', 'Completed', 'Paused', 'Cancelled']).optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.deadline) {
        return new Date(data.deadline) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: 'Goal deadline cannot be before the start date',
      path: ['deadline'],
    }
  );

const goalStatusSchema = z.object({
  status: z.enum(['Not Started', 'In Progress', 'Completed', 'Paused', 'Cancelled']),
});

module.exports = {
  goalSchema,
  goalUpdateSchema,
  goalStatusSchema,
};
