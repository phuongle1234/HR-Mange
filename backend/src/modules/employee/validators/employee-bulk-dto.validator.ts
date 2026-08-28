import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { PrismaService } from '../../../prisma/prisma.service';
import { recordBulkFieldError } from '../../../common/validators/bulk-field-error-collector';

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

/**
 * Maps each present value (lower-cased, so matching is case-insensitive like
 * the database lookups) to the index of the item that owns it. When two items
 * share a value the later index wins, which is harmless here: the duplicate
 * itself is already reported by the HasUniqueEmployeeBulk* constraints.
 */
function indexByLoweredValue(items: EmployeeBulkItem[], key: 'employeeCode' | 'email'): Map<string, number> {
  const owners = new Map<string, number>();

  items.forEach((item, index) => {
    const value = item[key];
    if (typeof value !== 'string' || value.length === 0) return;
    owners.set(value.toLowerCase(), index);
  });

  return owners;
}

/** The distinct non-empty values submitted for one field, casing preserved. */
function submittedValues(items: EmployeeBulkItem[], key: 'employeeCode' | 'email'): string[] {
  const values = items
    .map((item) => item[key])
    .filter((value): value is string => typeof value === 'string' && value.length > 0);

  return [...new Set(values)];
}

/**
 * Returns the indexes of every item after the first that repeats a value, so
 * each offending row can be reported at its own field path. The first
 * occurrence is treated as valid - only the repeats are flagged.
 */
function duplicateIndexes(items: EmployeeBulkItem[], key: keyof EmployeeBulkItem): number[] {
  const seen = new Set<unknown>();
  const duplicates: number[] = [];

  items.forEach((item, index) => {
    const value = item[key];
    if (value === undefined || value === null || value === '') return;

    const comparable = typeof value === 'string' ? value.toLowerCase() : value;
    if (seen.has(comparable)) {
      duplicates.push(index);
      return;
    }
    seen.add(comparable);
  });

  return duplicates;
}

/**
 * Shared body for the "no duplicates inside one request" constraints: report
 * each repeated row at `items.<index>.<field>` and fail, or pass when clean.
 */
function validateNoDuplicates(
  value: unknown,
  args: ValidationArguments,
  key: 'id' | 'employeeCode' | 'email',
  message: string,
): boolean {
  const duplicates = duplicateIndexes(asItems(value), key);
  duplicates.forEach((index) => recordBulkFieldError(args, `items.${index}.${key}`, message));
  return duplicates.length === 0;
}

@ValidatorConstraint({ name: 'HasUniqueEmployeeBulkIds', async: false })
export class HasUniqueEmployeeBulkIdsConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    return validateNoDuplicates(value, args, 'id', 'Duplicate employee id in request.');
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
  validate(value: unknown, args: ValidationArguments): boolean {
    return validateNoDuplicates(value, args, 'employeeCode', 'Duplicate employee code in request.');
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
  validate(value: unknown, args: ValidationArguments): boolean {
    return validateNoDuplicates(value, args, 'email', 'Duplicate email in request.');
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

  /**
   * One batched query for the whole array (not one per item), then per-row
   * reporting through `recordBulkFieldError` so the client receives
   * `items.<index>.employeeCode` / `items.<index>.email` instead of a single
   * blanket message on `items`.
   *
   * `employeeCode` and `email` are matched independently. Matching them with
   * a single `find(... code === ... || email === ...)` would attribute a
   * conflict to the first row matching *either* field, which blames the
   * wrong row whenever one row collides on code and a different row collides
   * on email.
   */
  async validate(value: unknown, args: ValidationArguments): Promise<boolean> {
    const items = asItems(value);
    const codeOwners = indexByLoweredValue(items, 'employeeCode');
    const emailOwners = indexByLoweredValue(items, 'email');
    if (codeOwners.size === 0 && emailOwners.size === 0) return true;

    // Query with the submitted values as-is: PostgreSQL `IN` is
    // case-sensitive, so sending lower-cased values would miss rows stored
    // with different casing. The lower-cased maps are only used to look the
    // owning row index back up afterwards.
    const found = await this.prisma.employee.findMany({
      where: {
        OR: [
          ...(codeOwners.size > 0 ? [{ employeeCode: { in: submittedValues(items, 'employeeCode') } }] : []),
          ...(emailOwners.size > 0 ? [{ email: { in: submittedValues(items, 'email') } }] : []),
        ],
      },
      select: { id: true, employeeCode: true, email: true },
    });

    let isValid = true;

    for (const row of found) {
      // A row owned by the item being updated is not a conflict with itself.
      const conflictsWith = (index: number | undefined): boolean =>
        index !== undefined && items[index]?.id !== row.id;

      const codeIndex = codeOwners.get(row.employeeCode.toLowerCase());
      if (conflictsWith(codeIndex)) {
        recordBulkFieldError(args, `items.${codeIndex}.employeeCode`, 'Employee code is already in use.');
        isValid = false;
      }

      const emailIndex = emailOwners.get(row.email.toLowerCase());
      if (conflictsWith(emailIndex)) {
        recordBulkFieldError(args, `items.${emailIndex}.email`, 'Email is already in use.');
        isValid = false;
      }
    }

    return isValid;
  }

  /**
   * Fallback only. When this constraint fails it has already recorded
   * granular per-row paths, which supersede this array-level message.
   */
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

  async validate(value: unknown, args: ValidationArguments): Promise<boolean> {
    const items = asItems(value);
    const ids = [
      ...new Set(items.map((item) => item.organizationId).filter((id): id is number => typeof id === 'number')),
    ];
    if (ids.length === 0) return true;

    const found = await this.prisma.organization.findMany({ where: { id: { in: ids } }, select: { id: true } });
    if (found.length === ids.length) return true;

    // Report each offending row rather than one blanket message on `items`.
    const existingIds = new Set(found.map((organization) => organization.id));
    items.forEach((item, index) => {
      if (typeof item.organizationId !== 'number' || existingIds.has(item.organizationId)) return;
      recordBulkFieldError(args, `items.${index}.organizationId`, 'Organization does not exist.');
    });

    return false;
  }

  /**
   * Fallback only - granular per-row paths recorded above supersede this.
   */
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
