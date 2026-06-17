import { z } from 'zod';
import { CASE_STATUSES } from '../constants/workflows';

export const updateCaseSchema = z.object({
  return_category: z.string().max(50).nullable().optional(),
  next_action: z.string().max(255).nullable().optional(),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
    .nullable()
    .optional(),
  expected_completion_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
    .nullable()
    .optional(),
  blocker_code: z.string().max(50).nullable().optional(),
  blocker_note: z.string().max(1000).nullable().optional(),
  hold_reason: z.string().max(1000).nullable().optional(),
  next_review_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
    .nullable()
    .optional(),
  follow_up_excluded: z.boolean().optional(),
});

export type UpdateCaseInput = z.infer<typeof updateCaseSchema>;

export const transitionCaseSchema = z.object({
  toStatus: z.enum(CASE_STATUSES),
  reason: z.string().max(1000).nullable().optional(),
});

export type TransitionCaseInput = z.infer<typeof transitionCaseSchema>;
