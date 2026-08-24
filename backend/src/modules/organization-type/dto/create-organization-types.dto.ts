import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { HasUniqueOrganizationTypeNames } from '../validators/organization-type-dto.validator';

export class CreateOrganizationTypeItemDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name!: string;

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

export class CreateOrganizationTypesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @HasUniqueOrganizationTypeNames()
  @ValidateNested({ each: true })
  @Type(() => CreateOrganizationTypeItemDto)
  items!: CreateOrganizationTypeItemDto[];
}
