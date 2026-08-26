import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { PrismaService } from '../../../prisma/prisma.service';

function collectOrganizationTypeIds(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (!Array.isArray(value)) return [];

  return [
    ...new Set(
      value
        .map((item) => (item as { organizationTypeId?: unknown }).organizationTypeId)
        .filter((id): id is string => typeof id === 'string' && id.length > 0),
    ),
  ];
}

@ValidatorConstraint({ name: 'OrganizationTypeReferenceExists', async: true })
@Injectable()
export class OrganizationTypeReferenceExistsConstraint implements ValidatorConstraintInterface {
  constructor(private readonly prisma: PrismaService) {}

  async validate(value: unknown, args: ValidationArguments): Promise<boolean> {
    const ids = collectOrganizationTypeIds(value ?? (args.object as { items?: unknown }).items);
    if (ids.length === 0) return true;
    if (!this.prisma) return false;

    const found = await this.prisma.organizationType.findMany({ where: { id: { in: ids } }, select: { id: true } });
    return found.length === ids.length;
  }

  defaultMessage(): string {
    return 'organizationTypeId must reference an existing organization type.';
  }
}

export function OrganizationTypeReferenceExists(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: OrganizationTypeReferenceExistsConstraint,
    });
  };
}
