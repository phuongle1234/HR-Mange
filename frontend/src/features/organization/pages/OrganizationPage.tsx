import { useMemo, useState } from 'react';
import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { toast } from 'react-toastify';
import { ConfirmDialog, ReviewRow } from '../../../shared/components/ConfirmDialog';
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
type PendingDelete = { ids: number[]; name: string };

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
  const [createApiError, setCreateApiError] = useState<unknown>(null);
  const [editApiError, setEditApiError] = useState<unknown>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const organizationsQuery = useOrganizationsQuery();
  const organizationTypesQuery = useOrganizationTypesQuery(ORGANIZATION_TYPE_QUERY);
  const createMutation = useCreateOrganizationsMutation();
  const updateMutation = useUpdateOrganizationsMutation();
  const deleteMutation = useDeleteOrganizationsMutation();

  const organizations = useMemo(() => (organizationsQuery.data ?? []).map(mapApiItemToStage), [organizationsQuery.data]);
  const organizationTypeOptions = useMemo(() => (organizationTypesQuery.data?.items ?? []).map((item) => ({ value: item.id, label: item.name })), [organizationTypesQuery.data]);
  const { nodes, edges } = useOrganizationFlow(organizations);

  const getOrganization = (uiId: number) => organizations.find((organization) => organization.uiId === uiId);

  async function deleteOrganizationTree(ids: number[]) {
    await deleteMutation.mutateAsync({ ids });
    toast.success('Organizations deleted successfully.', { position: 'top-right' });
  }

  const actions: OrganizationActions = useMemo(
    () => ({
      onAddChild: (uiId) => {
        setCreateApiError(null);
        setModalState({ type: 'create', parentUiId: uiId });
      },
      onDelete: (uiId) => {
        const organization = getOrganization(uiId);
        setPendingDelete({ ids: [uiId, ...findDescendantUiIds(uiId, organizations)], name: organization?.name ?? 'this organization' });
      },
      onOpenEdit: (uiId) => {
        setEditApiError(null);
        setModalState({ type: 'edit', uiId });
      },
    }),
    [organizations],
  );

  const createParent = modalState?.type === 'create' && modalState.parentUiId !== null ? (getOrganization(modalState.parentUiId) ?? null) : null;
  const editingOrganization = modalState?.type === 'edit' ? (getOrganization(modalState.uiId) ?? null) : null;
  const editingParent = editingOrganization?.parentUiId != null ? (getOrganization(editingOrganization.parentUiId) ?? null) : null;
  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  function closeModal() {
    if (!isMutating) {
      setCreateApiError(null);
      setEditApiError(null);
      setModalState(null);
    }
  }

  async function createOrganizations(rows: CreateOrganizationFormValues['rows']) {
    const parentId = modalState?.type === 'create' ? modalState.parentUiId : null;
    try {
      setCreateApiError(null);
      await createMutation.mutateAsync({ items: rows.map((row) => ({ code: row.code, name: row.name, organizationTypeId: row.organizationTypeId ?? null, description: row.description || null, parentId })) });
      toast.success('Organizations created successfully.', { position: 'top-right' });
      setModalState(null);
    } catch (error) {
      setCreateApiError(error);
    }
  }

  async function updateOrganization(values: EditOrganizationFormValues) {
    if (!editingOrganization?.id) return;
    try {
      setEditApiError(null);
      await updateMutation.mutateAsync({ items: [{ id: editingOrganization.id, code: values.code, name: values.name, organizationTypeId: values.organizationTypeId ?? null, description: values.description || null, isActive: values.isActive }] });
      toast.success('Organization updated successfully.', { position: 'top-right' });
      setModalState(null);
    } catch (error) {
      setEditApiError(error);
    }
  }

  function closeDeleteDialog() {
    if (!deleteMutation.isPending) {
      setPendingDelete(null);
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    try {
      await deleteOrganizationTree(pendingDelete.ids);
      setPendingDelete(null);
    } catch {
      setPendingDelete(null);
    }
  }

  if (organizationsQuery.isLoading) return <LoadingState label="Loading organizations..." />;
  if (organizationsQuery.isError) return <ErrorState message={getErrorMessage(organizationsQuery.error)} onRetry={() => organizationsQuery.refetch()} />;

  return (
    <div>
      <OrganizationToolbar onAddOrganization={() => setModalState({ type: 'create', parentUiId: null })} />

      {organizations.length === 0 ? (
        <div className="flex h-[calc(100vh-260px)] min-h-[420px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50">
          <p className="text-sm font-semibold text-slate-500">No organizations yet</p>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setCreateApiError(null); setModalState({ type: 'create', parentUiId: null }); }}>Add Organization</Button>
        </div>
      ) : (
        <OrganizationFlow nodes={nodes} edges={edges} actions={actions} />
      )}

      <CreateOrganizationModal isOpen={modalState?.type === 'create'} parent={createParent} organizationTypeOptions={organizationTypeOptions} apiError={createApiError} isSubmitting={createMutation.isPending} onCancel={closeModal} onSubmit={createOrganizations} />
      <EditOrganizationModal organization={editingOrganization} parent={editingParent} organizationTypeOptions={organizationTypeOptions} apiError={editApiError} isSubmitting={updateMutation.isPending} onCancel={closeModal} onSubmit={updateOrganization} />
      <ConfirmDialog isOpen={Boolean(pendingDelete)} title="Delete Organization" message="This will delete the selected organization and every child organization below it." confirmLabel="Confirm delete" confirmVariant="danger" isConfirming={deleteMutation.isPending} onConfirm={handleConfirmDelete} onCancel={closeDeleteDialog}>
        {pendingDelete && (
          <>
            <ReviewRow label="Organization" value={pendingDelete.name} />
            <ReviewRow label="Rows" value={pendingDelete.ids.length} />
          </>
        )}
      </ConfirmDialog>
    </div>
  );
}
