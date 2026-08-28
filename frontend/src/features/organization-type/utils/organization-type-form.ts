import type {
  CreateOrganizationTypesPayload,
  OrganizationType,
  OrganizationTypeCreateItem,
  OrganizationTypeUpdateItem,
  UpdateOrganizationTypesPayload,
} from '../types/organization-type.types';
import type { OrganizationTypeCreateFormValues, OrganizationTypeUpdateFormValues } from '../schemas/organization-type.schema';

function normalizeDescription(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function buildCreateOrganizationTypesPayload(values: OrganizationTypeCreateFormValues): CreateOrganizationTypesPayload {
  return {
    items: values.items.map((item): OrganizationTypeCreateItem => ({
      name: item.name.trim(),
      description: normalizeDescription(item.description),
    })),
  };
}

export function buildUpdateOrganizationTypesPayload(values: OrganizationTypeUpdateFormValues): UpdateOrganizationTypesPayload {
  return {
    items: values.items.map((item): OrganizationTypeUpdateItem => ({
      id: item.id,
      name: item.name.trim(),
      description: normalizeDescription(item.description),
    })),
  };
}

export function mapOrganizationTypesToUpdateFormValues(items: OrganizationType[]): OrganizationTypeUpdateFormValues {
  return {
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description ?? '',
    })),
  };
}
