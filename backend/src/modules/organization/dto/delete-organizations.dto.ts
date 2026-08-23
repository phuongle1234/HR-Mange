import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { OrganizationFilterDto } from './organization-filter.dto';

export class DeleteOrganizationsDto {
  @ValidateNested()
  @Type(() => OrganizationFilterDto)
  where!: OrganizationFilterDto;
}
