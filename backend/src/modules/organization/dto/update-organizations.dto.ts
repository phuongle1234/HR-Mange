import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { OrganizationFilterDto } from './organization-filter.dto';
import { UpdateOrganizationDto } from './update-organization.dto';

export class UpdateOrganizationsDto {
  @ValidateNested()
  @Type(() => OrganizationFilterDto)
  where!: OrganizationFilterDto;

  @ValidateNested()
  @Type(() => UpdateOrganizationDto)
  data!: UpdateOrganizationDto;
}
