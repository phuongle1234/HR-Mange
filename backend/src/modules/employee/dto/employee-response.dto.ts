import { EmployeeStatus } from '@prisma/client';

export class EmployeeResponseDto {
  id!: string;
  employeeCode!: string;
  firstName!: string;
  lastName!: string;
  email!: string;
  phone!: string | null;
  position!: string | null;
  status!: EmployeeStatus;
  createdAt!: Date;
  updatedAt!: Date;
}
