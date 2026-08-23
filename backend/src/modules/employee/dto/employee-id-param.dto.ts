import { IsUUID } from 'class-validator';

export class EmployeeIdParamDto {
  @IsUUID('4', { message: 'id must be a valid UUID.' })
  id!: string;
}
