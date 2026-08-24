import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

function normalizeName(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

@ValidatorConstraint({ name: 'HasUniqueOrganizationTypeNames', async: false })
class HasUniqueOrganizationTypeNamesConstraint implements ValidatorConstraintInterface {
  validate(items: unknown): boolean {
    if (!Array.isArray(items)) {
      return true;
    }

    const seen = new Set<string>();
    for (const item of items) {
      const normalized = normalizeName((item as { name?: unknown }).name);
      if (!normalized) {
        continue;
      }
      if (seen.has(normalized)) {
        return false;
      }
      seen.add(normalized);
    }
    return true;
  }

  defaultMessage(): string {
    return 'Organization type names must be unique within the request.';
  }
}

export function HasUniqueOrganizationTypeNames(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: HasUniqueOrganizationTypeNamesConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'OrganizationTypeUpdatesHaveMutableField', async: false })
class OrganizationTypeUpdatesHaveMutableFieldConstraint implements ValidatorConstraintInterface {
  validate(items: unknown): boolean {
    if (!Array.isArray(items)) {
      return true;
    }

    return items.every((item) => {
      const updateItem = item as { name?: unknown; description?: unknown };
      return updateItem.name !== undefined || updateItem.description !== undefined;
    });
  }

  defaultMessage(): string {
    return 'Each update item must include at least one mutable field.';
  }
}

export function OrganizationTypeUpdatesHaveMutableField(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: OrganizationTypeUpdatesHaveMutableFieldConstraint,
    });
  };
}
