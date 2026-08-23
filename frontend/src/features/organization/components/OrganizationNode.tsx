import type { MouseEvent } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import ApartmentIcon from '@mui/icons-material/Apartment';
import { IconButton } from '@mui/material';
import { ORGANIZATION_TYPE_LABELS } from '../types/organization.types';
import type { OrganizationFlowNode } from '../utils/organization-layout';
import { useOrganizationActions } from './organization-actions.context';

const HANDLE_STYLE = { opacity: 0 };

/**
 * Custom React Flow node (task §10). Header: [+] icon name [x]. Body: type,
 * manager. `[+]`/`[x]` stop propagation so they never also trigger the body
 * click (Edit modal) - task §21.
 */
export function OrganizationNode({ id, data }: NodeProps<OrganizationFlowNode>) {
  const { organization } = data;
  const { onAddChild, onDelete, onOpenEdit } = useOrganizationActions();

  function handleAddClick(event: MouseEvent) {
    event.stopPropagation();
    onAddChild(organization.uiId);
  }

  function handleDeleteClick(event: MouseEvent) {
    event.stopPropagation();
    onDelete(organization.uiId);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpenEdit(organization.uiId)}
      data-node-id={id}
      className="w-[220px] cursor-pointer rounded-lg border border-slate-300 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
    >
      <Handle type="target" position={Position.Top} style={HANDLE_STYLE} isConnectable={false} />

      <div className="flex items-center justify-between gap-1">
        <IconButton
          size="small"
          aria-label={`Add child organization to ${organization.name}`}
          onClick={handleAddClick}
        >
          <AddIcon fontSize="inherit" />
        </IconButton>

        <span className="flex min-w-0 flex-1 items-center justify-center gap-1 truncate text-sm font-bold text-slate-900">
          <ApartmentIcon fontSize="inherit" />
          <span className="truncate">{organization.name}</span>
        </span>

        <IconButton
          size="small"
          aria-label={`Delete ${organization.name}`}
          onClick={handleDeleteClick}
        >
          <CloseIcon fontSize="inherit" />
        </IconButton>
      </div>

      <div className="mt-1 text-center text-xs text-slate-500">
        <p className="font-semibold uppercase tracking-wide">{ORGANIZATION_TYPE_LABELS[organization.type]}</p>
        {organization.manager?.name && <p>Manager: {organization.manager.name}</p>}
      </div>

      <Handle type="source" position={Position.Bottom} style={HANDLE_STYLE} isConnectable={false} />
    </div>
  );
}
