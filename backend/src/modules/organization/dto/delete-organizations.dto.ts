import { ArrayMinSize, ArrayUnique, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class DeleteOrganizationsDto {
  @ArrayMinSize(1, { message: 'ids must contain at least 1 organization id.' })
  @ArrayUnique({ message: 'ids must not contain duplicate ids.' })
  @Type(() => Number)
  @IsInt({ each: true })
  ids!: number[];
}
