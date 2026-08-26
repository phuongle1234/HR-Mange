import { Module } from '@nestjs/common';
import { EmployeeController } from './controller/employee.controller';
import { EmployeeService } from './service/employee.service';
import { AuthModule } from '../auth/auth.module';
import {
  IsEmployeeCodeUniqueConstraint,
  IsEmployeeEmailUniqueConstraint,
} from './validators/employee-unique.validator';
import { AttachRouteIdInterceptor } from './interceptors/attach-route-id.interceptor';
import {
  EmployeeBulkFieldsAreUniqueInDatabaseConstraint,
  EmployeeBulkOrganizationsExistConstraint,
  HasEmployeeBulkMutableFieldConstraint,
  HasUniqueEmployeeBulkCodesConstraint,
  HasUniqueEmployeeBulkEmailsConstraint,
  HasUniqueEmployeeBulkIdsConstraint,
} from './validators/employee-bulk-dto.validator';
import { HasUniqueEmployeeIdsConstraint } from './validators/employee-ids-dto.validator';

@Module({
  imports: [AuthModule],
  controllers: [EmployeeController],
  providers: [
    EmployeeService,
    {
      provide: 'IEmployeeService',
      useExisting: EmployeeService,
    },
    IsEmployeeCodeUniqueConstraint,
    IsEmployeeEmailUniqueConstraint,
    HasUniqueEmployeeBulkIdsConstraint,
    HasUniqueEmployeeBulkCodesConstraint,
    HasUniqueEmployeeBulkEmailsConstraint,
    HasEmployeeBulkMutableFieldConstraint,
    EmployeeBulkFieldsAreUniqueInDatabaseConstraint,
    EmployeeBulkOrganizationsExistConstraint,
    HasUniqueEmployeeIdsConstraint,
    AttachRouteIdInterceptor,
  ],
})
export class EmployeeModule {}
