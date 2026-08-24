import { z } from 'zod';

const nameSchema = z.string().trim().min(1, 'Name is required').max(100, 'Name must be 100 characters or fewer');
const descriptionSchema = z.string().trim().max(1000, 'Description must be 1000 characters or fewer');

function addDuplicateNameIssues(values: { items: { name: string }[] }, context: z.RefinementCtx) {
  const seen = new Map<string, number>();
  values.items.forEach((item, index) => {
    const key = item.name.trim().toLocaleLowerCase();
    if (!key) {
      return;
    }
    const firstIndex = seen.get(key);
    if (firstIndex !== undefined) {
      context.addIssue({ code: 'custom', message: 'Name must be unique within this form', path: ['items', index, 'name'] });
      context.addIssue({ code: 'custom', message: 'Name must be unique within this form', path: ['items', firstIndex, 'name'] });
      return;
    }
    seen.set(key, index);
  });
}

export const organizationTypeCreateSchema = z.object({
  items: z.array(z.object({ name: nameSchema, description: descriptionSchema })).min(1, 'Add at least one organization type').max(100, 'You can submit up to 100 organization types at once'),
}).superRefine(addDuplicateNameIssues);

export const organizationTypeUpdateSchema = z.object({
  items: z.array(z.object({ id: z.uuid('Invalid organization type id'), name: nameSchema, description: descriptionSchema })).min(1, 'Add at least one organization type').max(100, 'You can submit up to 100 organization types at once'),
}).superRefine(addDuplicateNameIssues);

export type OrganizationTypeCreateFormValues = z.infer<typeof organizationTypeCreateSchema>;
export type OrganizationTypeUpdateFormValues = z.infer<typeof organizationTypeUpdateSchema>;

export const DEFAULT_ORGANIZATION_TYPE_CREATE_VALUES: OrganizationTypeCreateFormValues = {
  items: [{ name: '', description: '' }],
};
