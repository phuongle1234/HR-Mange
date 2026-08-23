import type { OrganizationStage } from '../types/organization.types';

/**
 * Task §26/§29 - no real request is made yet. Once the backend endpoints
 * from `docs/06-api` (or `backend/test/http/organization/organization.http`)
 * are ready to consume, wire these up the same way
 * `features/employee/services/employee.api.ts` calls `baseApiService` +
 * `ApiEndpoints`, and swap `useOrganizationStage`'s local state for real
 * query/mutation hooks, e.g.:
 *
 * // const { data, isLoading } = useQuery({
 * //   queryKey: ['organizations'],
 * //   queryFn: organizationApi.getTree,
 * // });
 * //
 * // const createMutation = useMutation({
 * //   mutationFn: organizationApi.create,
 * // });
 */
export const organizationApi = {
  getTree(): Promise<OrganizationStage[]> {
    // TODO: integrate GET /api/organizations
    throw new Error('organizationApi.getTree is not implemented yet - this screen only uses the Frontend Stage.');
  },

  create(_payload: unknown): Promise<OrganizationStage[]> {
    // TODO: integrate POST /api/organizations
    throw new Error('organizationApi.create is not implemented yet - this screen only uses the Frontend Stage.');
  },

  update(_id: number, _payload: unknown): Promise<OrganizationStage> {
    // TODO: integrate PATCH /api/organizations
    throw new Error('organizationApi.update is not implemented yet - this screen only uses the Frontend Stage.');
  },

  delete(_id: number): Promise<void> {
    // TODO: integrate DELETE /api/organizations
    throw new Error('organizationApi.delete is not implemented yet - this screen only uses the Frontend Stage.');
  },
};
