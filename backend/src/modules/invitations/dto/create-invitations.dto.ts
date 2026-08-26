import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsUUID } from 'class-validator';

export class CreateInvitationsDto {
  @ArrayMinSize(1, { message: 'employeeIds must contain at least 1 employee id.' })
  @ArrayMaxSize(100, { message: 'employeeIds must contain no more than 100 employee ids.' })
  @ArrayUnique({ message: 'employeeIds must not contain duplicate ids.' })
  @IsUUID(undefined, { each: true })
  employeeIds!: string[];
}
