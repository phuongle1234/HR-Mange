import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * `args.object.id` is populated by AttachRouteIdInterceptor from the route
 * `:id` param (PUT /employees/:id) before this DTO is validated - it is not
 * a client-supplied field. On create, `id` is absent, so no row is excluded.
 */
function getExcludeId(args: ValidationArguments): string | undefined {
  return (args.object as { id?: string }).id;
}

@ValidatorConstraint({ name: 'IsEmployeeCodeUnique', async: true })
@Injectable()
export class IsEmployeeCodeUniqueConstraint implements ValidatorConstraintInterface {
  constructor(private readonly prisma: PrismaService) {}

  async validate(employeeCode: unknown, args: ValidationArguments): Promise<boolean> {
    if (typeof employeeCode !== 'string' || employeeCode.length === 0) {
      return true;
    }

    const found = await this.prisma.employee.findUnique({ where: { employeeCode } });
    if (!found) {
      return true;
    }
    return found.id === getExcludeId(args);
  }

  defaultMessage(args: ValidationArguments): string {
    return `Employee code "${args.value}" is already in use.`;
  }
}

export function IsEmployeeCodeUnique(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsEmployeeCodeUniqueConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'IsEmployeeEmailUnique', async: true })
@Injectable()
export class IsEmployeeEmailUniqueConstraint implements ValidatorConstraintInterface {
  constructor(private readonly prisma: PrismaService) {}

  async validate(email: unknown, args: ValidationArguments): Promise<boolean> {
    if (typeof email !== 'string' || email.length === 0) {
      return true;
    }

    const found = await this.prisma.employee.findUnique({ where: { email } });
    if (!found) {
      return true;
    }
    return found.id === getExcludeId(args);
  }

  defaultMessage(args: ValidationArguments): string {
    return `Email "${args.value}" is already in use.`;
  }
}

export function IsEmployeeEmailUnique(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsEmployeeEmailUniqueConstraint,
    });
  };
}
