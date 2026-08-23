import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

interface OrganizationToolbarProps {
  onAddOrganization: () => void;
}

/** Task §6 header: title + "[+ Add Organization]" (root, parentUiId = null). */
export function OrganizationToolbar({ onAddOrganization }: OrganizationToolbarProps) {
  return (
    <div className="mb-4 flex items-center justify-end">
      <Button variant="contained" startIcon={<AddIcon />} onClick={onAddOrganization}>
        Add Organization
      </Button>
    </div>
  );
}
