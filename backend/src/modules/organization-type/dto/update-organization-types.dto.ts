import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  HasUniqueOrganizationTypeNames,
  OrganizationTypeUpdatesHaveMutableField,
} from '../validators/organization-type-dto.validator';

export class UpdateOrganizationTypeItemDto {
  @IsUUID('all')
  id!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  })
  description?: string | null;
}

export class UpdateOrganizationTypesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @HasUniqueOrganizationTypeNames()
  @OrganizationTypeUpdatesHaveMutableField()
  @ValidateNested({ each: true })
  @Type(() => UpdateOrganizationTypeItemDto)
  items!: UpdateOrganizationTypeItemDto[];
}
