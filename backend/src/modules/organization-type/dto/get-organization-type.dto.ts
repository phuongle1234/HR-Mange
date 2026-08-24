export class GetOrganizationTypeDto {
  id!: string;
  name!: string;
  description?: string | null;
  createdByUserId?: string | null;
  updatedByUserId?: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}
