import { z } from 'zod';

export const workflowFormFieldOptionSchema = z.object({
  label: z.string().min(1, 'Option label is required.'),
  value: z.string().min(1, 'Option value is required.'),
});

export const workflowFormFieldSchema = z.object({
  key: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Field key must start with a letter and may use letters, numbers, or underscores.'),
  label: z.string().min(1, 'Field label is required.'),
  type: z.enum(['text', 'textarea', 'number', 'date', 'select', 'checkbox']),
  required: z.boolean(),
  placeholder: z.string().optional(),
  options: z.array(workflowFormFieldOptionSchema).optional(),
}).superRefine((field, ctx) => {
  if (field.type === 'select') {
    if (!field.options || field.options.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Select fields require at least one option.',
        path: ['options'],
      });
    }
    return;
  }

  if (field.options && field.options.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Options are only valid for select fields.',
      path: ['options'],
    });
  }
});

export const workflowDraftSchema = z.object({
  code: z.string().min(1, 'Workflow code is required.'),
  name: z.string().min(1, 'Workflow name is required.'),
  description: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']),
  fields: z.array(workflowFormFieldSchema).min(1, 'Add at least one field.'),
});

export type WorkflowDraftFormValues = z.infer<typeof workflowDraftSchema>;
