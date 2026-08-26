import { useMemo, useState } from 'react';
import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { toast } from 'react-toastify';
import { useOrganizationFlow } from '../hooks/useOrganizationFlow';
import { OrganizationToolbar } from '../components/OrganizationToolbar';
import { OrganizationFlow } from '../components/OrganizationFlow';
import { CreateOrganizationModal } from '../components/CreateOrganizationModal';
import { EditOrganizationModal } from '../components/EditOrganizationModal';
import type { OrganizationActions } from '../components/organization-actions.context';
import { useOrganizationsQuery } from '../hooks/useOrganizationsQuery';
import { useCreateOrganizationsMutation } from '../hooks/useCreateOrganizationsMutation';
import { useUpdateOrganizationsMutation } from '../hooks/useUpdateOrganizationsMutation';
import { useDeleteOrganizationsMutation } from '../hooks/useDeleteOrganizationsMutation';
import { useOrganizationTypesQuery } from '../../organization-type/hooks/useOrganizationTypesQuery';
import { findDescendantUiIds } from '../utils/organization-tree';
import type { CreateOrganizationFormValues, EditOrganizationFormValues } from '../schemas/organization.schemas';
import type { OrganizationApiItem, OrganizationStage } from '../types/organization.types';
import type { FrontendApiError } from '../../../shared/api/api-error';
import { ErrorState, LoadingState } from '../../../shared/components/PageStates';

type ModalState = { type: 'create'; parentUiId: number | null } | { type: 'edit'; uiId: number } | null;

const ORGANIZATION_TYPE_QUERY = { page: 1, limit: 100, search: '', sortBy: 'name' as const, sortOrder: 'asc' as const };

function mapApiItemToStage(item: OrganizationApiItem): OrganizationStage {
  return {
    uiId: item.id,
    parentUiId: item.parentId,
    id: item.id,
    code: item.code,
    name: item.name,
    type: item.type,
    organizationTypeId: item.organizationTypeId,
    description: item.description ?? undefined,
    isActive: item.isActive,
  };
}

function getErrorMessage(error: unknown): string {
  return (error as FrontendApiError | undefined)?.message ?? 'Something went wrong. Please try again.';
}

export function OrganizationPage() {
  const [modalState, setModalState] = useState<ModalState>(null);
  const organizationsQuery = useOrganizationsQuery();
  const organizationTypesQuery = useOrganizationTypesQuery(ORGANIZATION_TYPE_QUERY);
  const createMutation = useCreateOrganizationsMutation();
  const updateMutation = useUpdateOrganizationsMutation();
  const deleteMutation = useDeleteOrganizationsMutation();

  const organizations = useMemo(() => (organizationsQuery.data ?? []).map(mapApiItemToStage), [organizationsQuery.data]);
  const organizationTypeOptions = useMemo(() => (organizationTypesQuery.data?.items ?? []).map((item) => ({ value: item.id, label: item.name })), [organizationTypesQuery.data]);
  const { nodes, edges } = useOrganizationFlow(organizations);

  const getOrganization = (uiId: number) => organizations.find((organization) => organization.uiId === uiId);

  async function deleteOrganizationTree(uiId: number) {
    const targetIds = [uiId, ...findDescendantUiIds(uiId, organizations)];
    await deleteMutation.mutateAsync({ ids: targetIds });
    toast.success('Organizations deleted successfully.', { position: 'top-right' });
  }

  const actions: OrganizationActions = useMemo(
    () => ({
      onAddChild: (uiId) => setModalState({ type: 'create', parentUiId: uiId }),
      onDelete: (uiId) => {
        deleteOrganizationTree(uiId).catch((error) => toast.error(getErrorMessage(error), { position: 'top-right' }));
      },
      onOpenEdit: (uiId) => setModalState({ type: 'edit', uiId }),
    }),
    [organizations],
  );

  const createParent = modalState?.type === 'create' && modalState.parentUiId !== null ? (getOrganization(modalState.parentUiId) ?? null) : null;
  const editingOrganization = modalState?.type === 'edit' ? (getOrganization(modalState.uiId) ?? null) : null;
  const editingParent = editingOrganization?.parentUiId != null ? (getOrganization(editingOrganization.parentUiId) ?? null) : null;
  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  function closeModal() {
    if (!isMutating) setModalState(null);
  }

  async function createOrganizations(rows: CreateOrganizationFormValues['rows']) {
    const parentId = modalState?.type === 'create' ? modalState.parentUiId : null;
    await createMutation.mutateAsync({ items: rows.map((row) => ({ code: row.code, name: row.name, organizationTypeId: row.organizationTypeId ?? null, description: row.description || null, parentId })) });
    toast.success('Organizations created successfully.', { position: 'top-right' });
    setModalState(null);
  }

  async function updateOrganization(values: EditOrganizationFormValues) {
    if (!editingOrganization?.id) return;
    await updateMutation.mutateAsync({ items: [{ id: editingOrganization.id, code: values.code, name: values.name, organizationTypeId: values.organizationTypeId ?? null, description: values.description || null, isActive: values.isActive }] });
    toast.success('Organization updated successfully.', { position: 'top-right' });
    setModalState(null);
  }

  if (organizationsQuery.isLoading) return <LoadingState label="Loading organizations..." />;
  if (organizationsQuery.isError) return <ErrorState message={getErrorMessage(organizationsQuery.error)} onRetry={() => organizationsQuery.refetch()} />;

  return (
    <div>
      <OrganizationToolbar onAddOrganization={() => setModalState({ type: 'create', parentUiId: null })} />

      {organizations.length === 0 ? (
        <div className="flex h-[calc(100vh-260px)] min-h-[420px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50">
          <p className="text-sm font-semibold text-slate-500">No organizations yet</p>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setModalState({ type: 'create', parentUiId: null })}>Add Organization</Button>
        </div>
      ) : (
        <OrganizationFlow nodes={nodes} edges={edges} actions={actions} />
      )}

      <CreateOrganizationModal isOpen={modalState?.type === 'create'} parent={createParent} organizationTypeOptions={organizationTypeOptions} isSubmitting={createMutation.isPending} onCancel={closeModal} onSubmit={(rows) => createOrganizations(rows).catch((error) => toast.error(getErrorMessage(error), { position: 'top-right' }))} />
      <EditOrganizationModal organization={editingOrganization} parent={editingParent} organizationTypeOptions={organizationTypeOptions} isSubmitting={updateMutation.isPending} onCancel={closeModal} onSubmit={(values) => updateOrganization(values).catch((error) => toast.error(getErrorMessage(error), { position: 'top-right' }))} />
    </div>
  );
}
