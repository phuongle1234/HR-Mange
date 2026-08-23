import { ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrganizationDto } from './create-organization.dto';

export class CreateOrganizationsDto {
  @ArrayMinSize(1, { message: 'items must contain at least 1 organization.' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrganizationDto)
  items!: CreateOrganizationDto[];
}
