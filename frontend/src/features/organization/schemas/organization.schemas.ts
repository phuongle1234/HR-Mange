import { z } from 'zod';
import { ORGANIZATION_TYPE_VALUES } from '../types/organization.types';

const codeSchema = z
  .string()
  .trim()
  .min(1, 'Code is required')
  .max(50, 'Code must be 50 characters or fewer');

const nameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(255, 'Name must be 255 characters or fewer');

const typeSchema = z.enum(ORGANIZATION_TYPE_VALUES);

/** One row of the Create Organization modal's table - task §13. */
export const createOrganizationRowSchema = z.object({
  code: codeSchema,
  name: nameSchema,
  type: typeSchema,
  description: z.string().trim().optional(),
});
export type CreateOrganizationFormItem = z.infer<typeof createOrganizationRowSchema>;

/**
 * Task §16: code required/name required/type required (per-row schema
 * above), at least 1 row, and code must not repeat among the form's own
 * rows. Cross-checking against organizations[]'s already-existing codes is
 * NOT done here - the task's worked example only checks the form's own
 * rows (see docs/09-workflow/plans/organization-frontend-chart.md).
 */
export const createOrganizationFormSchema = z
  .object({
    rows: z.array(createOrganizationRowSchema).min(1, 'Add at least one organization.'),
  })
  .superRefine((value, ctx) => {
    const seenCodes = new Set<string>();
    value.rows.forEach((row, index) => {
      const key = row.code.trim().toLowerCase();
      if (seenCodes.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Code must be unique among the rows below.',
          path: ['rows', index, 'code'],
        });
      }
      seenCodes.add(key);
    });
  });
export type CreateOrganizationFormValues = z.infer<typeof createOrganizationFormSchema>;

export const DEFAULT_CREATE_ORGANIZATION_ROW: CreateOrganizationFormItem = {
  code: '',
  name: '',
  type: 'DEPARTMENT',
  description: '',
};

/** Edit Organization modal (the "Node Actions" section at the end of the task file). */
export const editOrganizationFormSchema = z.object({
  code: codeSchema,
  name: nameSchema,
  type: typeSchema,
  managerName: z.string().trim().max(255, 'Manager name must be 255 characters or fewer').optional(),
  isActive: z.boolean(),
  description: z.string().trim().optional(),
});
export type EditOrganizationFormValues = z.infer<typeof editOrganizationFormSchema>;
