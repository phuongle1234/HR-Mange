import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { PrismaService } from '../../../prisma/prisma.service';

interface EmployeeBulkItem {
  id?: string;
  employeeCode?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  position?: string | null;
  status?: string;
  organizationId?: number | null;
}

const EMPLOYEE_MUTABLE_FIELDS: Array<keyof EmployeeBulkItem> = [
  'employeeCode',
  'firstName',
  'lastName',
  'email',
  'phone',
  'position',
  'status',
  'organizationId',
];

function asItems(value: unknown): EmployeeBulkItem[] {
  return Array.isArray(value) ? (value as EmployeeBulkItem[]) : [];
}

function duplicateValue(items: EmployeeBulkItem[], key: keyof EmployeeBulkItem): unknown {
  const seen = new Set<unknown>();
  for (const item of items) {
    const value = item[key];
    if (value === undefined || value === null || value === '') continue;
    const comparable = typeof value === 'string' ? value.toLowerCase() : value;
    if (seen.has(comparable)) return value;
    seen.add(comparable);
  }
  return undefined;
}

@ValidatorConstraint({ name: 'HasUniqueEmployeeBulkIds', async: false })
export class HasUniqueEmployeeBulkIdsConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return duplicateValue(asItems(value), 'id') === undefined;
  }

  defaultMessage(): string {
    return 'items must not contain duplicate employee ids.';
  }
}

export function HasUniqueEmployeeBulkIds(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: HasUniqueEmployeeBulkIdsConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'HasUniqueEmployeeBulkCodes', async: false })
export class HasUniqueEmployeeBulkCodesConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return duplicateValue(asItems(value), 'employeeCode') === undefined;
  }

  defaultMessage(): string {
    return 'items must not contain duplicate employeeCode values.';
  }
}

export function HasUniqueEmployeeBulkCodes(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: HasUniqueEmployeeBulkCodesConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'HasUniqueEmployeeBulkEmails', async: false })
export class HasUniqueEmployeeBulkEmailsConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return duplicateValue(asItems(value), 'email') === undefined;
  }

  defaultMessage(): string {
    return 'items must not contain duplicate email values.';
  }
}

export function HasUniqueEmployeeBulkEmails(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: HasUniqueEmployeeBulkEmailsConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'HasEmployeeBulkMutableField', async: false })
export class HasEmployeeBulkMutableFieldConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return asItems(value).every((item) => EMPLOYEE_MUTABLE_FIELDS.some((field) => field in item));
  }

  defaultMessage(): string {
    return 'each item must include at least one mutable employee field.';
  }
}

export function HasEmployeeBulkMutableField(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: HasEmployeeBulkMutableFieldConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'EmployeeBulkFieldsAreUniqueInDatabase', async: true })
@Injectable()
export class EmployeeBulkFieldsAreUniqueInDatabaseConstraint implements ValidatorConstraintInterface {
  constructor(private readonly prisma: PrismaService) {}

  async validate(value: unknown): Promise<boolean> {
    const items = asItems(value);
    const codes = items.map((item) => item.employeeCode).filter((code): code is string => !!code);
    const emails = items.map((item) => item.email).filter((email): email is string => !!email);
    if (codes.length === 0 && emails.length === 0) return true;

    const found = await this.prisma.employee.findMany({
      where: {
        OR: [
          ...(codes.length > 0 ? [{ employeeCode: { in: codes } }] : []),
          ...(emails.length > 0 ? [{ email: { in: emails } }] : []),
        ],
      },
      select: { id: true, employeeCode: true, email: true },
    });

    return found.every((row) => {
      const matchingItem = items.find((item) => item.employeeCode === row.employeeCode || item.email === row.email);
      return !!matchingItem?.id && matchingItem.id === row.id;
    });
  }

  defaultMessage(): string {
    return 'employeeCode or email is already in use.';
  }
}

export function EmployeeBulkFieldsAreUniqueInDatabase(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: EmployeeBulkFieldsAreUniqueInDatabaseConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'EmployeeBulkOrganizationsExist', async: true })
@Injectable()
export class EmployeeBulkOrganizationsExistConstraint implements ValidatorConstraintInterface {
  constructor(private readonly prisma: PrismaService) {}

  async validate(value: unknown): Promise<boolean> {
    const ids = [
      ...new Set(
        asItems(value)
          .map((item) => item.organizationId)
          .filter((id): id is number => typeof id === 'number'),
      ),
    ];
    if (ids.length === 0) return true;

    const found = await this.prisma.organization.findMany({ where: { id: { in: ids } }, select: { id: true } });
    return found.length === ids.length;
  }

  defaultMessage(): string {
    return 'organizationId must reference an existing organization.';
  }
}

export function EmployeeBulkOrganizationsExist(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: EmployeeBulkOrganizationsExistConstraint,
    });
  };
}
