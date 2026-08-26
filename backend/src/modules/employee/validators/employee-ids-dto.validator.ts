import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'HasUniqueEmployeeIds', async: false })
export class HasUniqueEmployeeIdsConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (!Array.isArray(value)) return true;
    return new Set(value).size === value.length;
  }

  defaultMessage(): string {
    return 'ids must not contain duplicate employee ids.';
  }
}

export function HasUniqueEmployeeIds(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: HasUniqueEmployeeIdsConstraint,
    });
  };
}
