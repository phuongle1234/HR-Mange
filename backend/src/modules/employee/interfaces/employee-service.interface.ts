import { Employee } from '@prisma/client';
import { IBaseService } from '../../../common/interfaces/base.interface';
import { CreateEmployeeDto } from '../dto/create-employee.dto';
import { UpdateEmployeeDto } from '../dto/update-employee.dto';
import { GetEmployeesQueryDto } from '../dto/get-employees-query.dto';

export interface IEmployeeService
  extends IBaseService<Employee, CreateEmployeeDto, UpdateEmployeeDto, GetEmployeesQueryDto> {}
