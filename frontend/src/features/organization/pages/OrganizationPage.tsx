import { useMemo, useState } from 'react';
import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useOrganizationStage } from '../hooks/useOrganizationStage';
import { useOrganizationFlow } from '../hooks/useOrganizationFlow';
import { OrganizationToolbar } from '../components/OrganizationToolbar';
import { OrganizationFlow } from '../components/OrganizationFlow';
import { CreateOrganizationModal } from '../components/CreateOrganizationModal';
import { EditOrganizationModal } from '../components/EditOrganizationModal';
import type { OrganizationActions } from '../components/organization-actions.context';

type ModalState = { type: 'create'; parentUiId: number | null } | { type: 'edit'; uiId: number } | null;

/** Task §6/§7 - top-level Organization screen; source of truth is the Frontend Stage (§22). */
export function OrganizationPage() {
  const { organizations, addOrganizations, removeOrganizationTree, updateOrganization, getOrganization } =
    useOrganizationStage();
  const { nodes, edges } = useOrganizationFlow(organizations);

  const [modalState, setModalState] = useState<ModalState>(null);

  const actions: OrganizationActions = useMemo(
    () => ({
      onAddChild: (uiId) => setModalState({ type: 'create', parentUiId: uiId }),
      onDelete: (uiId) => removeOrganizationTree(uiId),
      onOpenEdit: (uiId) => setModalState({ type: 'edit', uiId }),
    }),
    [removeOrganizationTree],
  );

  const createParent =
    modalState?.type === 'create' && modalState.parentUiId !== null
      ? (getOrganization(modalState.parentUiId) ?? null)
      : null;

  const editingOrganization = modalState?.type === 'edit' ? (getOrganization(modalState.uiId) ?? null) : null;
  const editingParent =
    editingOrganization?.parentUiId != null ? (getOrganization(editingOrganization.parentUiId) ?? null) : null;

  function closeModal() {
    setModalState(null);
  }

  return (
    <>
      <div>
        <OrganizationToolbar onAddOrganization={() => setModalState({ type: 'create', parentUiId: null })} />

        {organizations.length === 0 ? (
          <div className="flex h-[calc(100vh-260px)] min-h-[420px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50">
            <p className="text-sm font-semibold text-slate-500">Chưa có Organization</p>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setModalState({ type: 'create', parentUiId: null })}
            >
              Add Organization
            </Button>
          </div>
        ) : (
          <OrganizationFlow nodes={nodes} edges={edges} actions={actions} />
        )}

        <CreateOrganizationModal
          isOpen={modalState?.type === 'create'}
          parent={createParent}
          onCancel={closeModal}
          onSubmit={(rows) => {
            addOrganizations(rows, modalState?.type === 'create' ? modalState.parentUiId : null);
            closeModal();
          }}
        />

        <EditOrganizationModal
          organization={editingOrganization}
          parent={editingParent}
          onCancel={closeModal}
          onSubmit={(values) => {
            if (modalState?.type === 'edit')  updateOrganization(modalState.uiId, values);
            closeModal();
          }}
        />
      </div>
    </>
  );
}
