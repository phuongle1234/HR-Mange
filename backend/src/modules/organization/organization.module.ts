import { Module } from '@nestjs/common';
import { OrganizationController } from './controller/organization.controller';
import { OrganizationService } from './service/organization.service';
import { OrganizationTypeReferenceExistsConstraint } from './validators/organization-type-reference.validator';

@Module({
  controllers: [OrganizationController],
  providers: [
    OrganizationService,
    {
      provide: 'IOrganizationService',
      useExisting: OrganizationService,
    },
    OrganizationTypeReferenceExistsConstraint,
  ],
})
export class OrganizationModule {}
