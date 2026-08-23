const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Employee `id` route params must be a UUID per API-EMPLOYEE-DETAIL's EmployeeIdParamDto. */
export function isValidEmployeeId(id: string | undefined): boolean {
  return typeof id === 'string' && UUID_PATTERN.test(id);
}
