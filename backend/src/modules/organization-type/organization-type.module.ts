import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrganizationTypeController } from './controller/organization-type.controller';
import { OrganizationTypeService } from './service/organization-type.service';

@Module({
  imports: [AuthModule],
  controllers: [OrganizationTypeController],
  providers: [
    OrganizationTypeService,
    {
      provide: 'IOrganizationTypeService',
      useExisting: OrganizationTypeService,
    },
  ],
})
export class OrganizationTypeModule {}
