import { ArrayMaxSize, ArrayMinSize, IsUUID } from 'class-validator';
import { HasUniqueEmployeeIds } from '../validators/employee-ids-dto.validator';

export class GetEmployeesByIdsDto {
  @ArrayMinSize(1, { message: 'ids must contain at least 1 employee id.' })
  @ArrayMaxSize(100, { message: 'ids must contain no more than 100 employee ids.' })
  @IsUUID(undefined, { each: true })
  @HasUniqueEmployeeIds()
  ids!: string[];
}
