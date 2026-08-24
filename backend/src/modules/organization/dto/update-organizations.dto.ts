import { ArrayMinSize, IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateOrganizationDto } from './update-organization.dto';

export class UpdateOrganizationItemDto extends UpdateOrganizationDto {
  @Type(() => Number)
  @IsInt()
  id!: number;
}

export class UpdateOrganizationsDto {
  @ArrayMinSize(1, { message: 'items must contain at least 1 organization.' })
  @ValidateNested({ each: true })
  @Type(() => UpdateOrganizationItemDto)
  items!: UpdateOrganizationItemDto[];
}
