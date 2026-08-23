import { Module } from '@nestjs/common';
import { EmployeeController } from './controller/employee.controller';
import { EmployeeService } from './service/employee.service';
import { AuthModule } from '../auth/auth.module';
import {
  IsEmployeeCodeUniqueConstraint,
  IsEmployeeEmailUniqueConstraint,
} from './validators/employee-unique.validator';
import { AttachRouteIdInterceptor } from './interceptors/attach-route-id.interceptor';

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
    AttachRouteIdInterceptor,
  ],
})
export class EmployeeModule {}
