import { Module } from '@nestjs/common';
import { OrganizationController } from './controller/organization.controller';
import { OrganizationService } from './service/organization.service';

@Module({
  controllers: [OrganizationController],
  providers: [
    OrganizationService,
    {
      provide: 'IOrganizationService',
      useExisting: OrganizationService,
    },
  ],
})
export class OrganizationModule {}
