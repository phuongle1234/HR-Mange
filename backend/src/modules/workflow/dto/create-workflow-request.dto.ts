import { IsObject, IsUUID } from 'class-validator';

/**
 * `formData` is validated against the workflow's own `form_schema`, which is
 * only known after reading the workflow row - so that check lives in the
 * service (validateFormDataAgainstSchema), not in a decorator here.
 */
export class CreateWorkflowRequestDto {
  @IsUUID(undefined, { message: 'workflowId must be a UUID.' })
  workflowId!: string;

  @IsObject({ message: 'formData must be an object.' })
  formData!: Record<string, unknown>;
}
