import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField as MuiTextField,
} from '@mui/material';
import { editOrganizationFormSchema } from '../schemas/organization.schemas';
import type { EditOrganizationFormValues } from '../schemas/organization.schemas';
import { ORGANIZATION_TYPE_LABELS, ORGANIZATION_TYPE_VALUES } from '../types/organization.types';
import type { OrganizationStage } from '../types/organization.types';

interface EditOrganizationModalProps {
  /** Non-null opens the dialog, prefilled from this record - task's "Node Actions" §3. */
  organization: OrganizationStage | null;
  parent: OrganizationStage | null;
  onCancel: () => void;
  onSubmit: (values: EditOrganizationFormValues) => void;
}

const DEFAULT_VALUES: EditOrganizationFormValues = {
  code: '',
  name: '',
  type: 'DEPARTMENT',
  managerName: '',
  isActive: true,
  description: '',
};

/**
 * Full edit form (code/name/type/manager/status/description), parent
 * readonly, uiId/parentUiId never touched here - matches the "Edit
 * Organization Modal" mockup at the end of the task file (see
 * docs/09-workflow/plans/organization-frontend-chart.md decision #1 for why
 * this is an edit form rather than the read-only Detail modal described
 * earlier in the same task file).
 */
export function EditOrganizationModal({ organization, parent, onCancel, onSubmit }: EditOrganizationModalProps) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditOrganizationFormValues>({
    resolver: zodResolver(editOrganizationFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (organization) {
      reset({
        code: organization.code,
        name: organization.name,
        type: organization.type,
        managerName: organization.manager?.name ?? '',
        isActive: organization.isActive ?? true,
        description: organization.description ?? '',
      });
    }
  }, [organization, reset]);

  function onValid(values: EditOrganizationFormValues) {
    onSubmit(values);
  }

  return (
    <Dialog open={Boolean(organization)} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Organization</DialogTitle>
      <DialogContent>
        <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
          <MuiTextField
            label="Code"
            required
            fullWidth
            error={Boolean(errors.code)}
            helperText={errors.code?.message}
            {...register('code')}
          />
          <MuiTextField
            label="Name"
            required
            fullWidth
            error={Boolean(errors.name)}
            helperText={errors.name?.message}
            {...register('name')}
          />

          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel id="edit-organization-type-label">Type</InputLabel>
                <Select labelId="edit-organization-type-label" label="Type" {...field}>
                  {ORGANIZATION_TYPE_VALUES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {ORGANIZATION_TYPE_LABELS[type]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />

          <MuiTextField label="Parent" fullWidth disabled value={parent?.name ?? '—'} />

          <MuiTextField
            label="Manager"
            fullWidth
            error={Boolean(errors.managerName)}
            helperText={errors.managerName?.message}
            {...register('managerName')}
          />

          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel id="edit-organization-status-label">Status</InputLabel>
                <Select
                  labelId="edit-organization-status-label"
                  label="Status"
                  value={field.value ? 'ACTIVE' : 'INACTIVE'}
                  onChange={(event) => field.onChange(event.target.value === 'ACTIVE')}
                >
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                </Select>
              </FormControl>
            )}
          />

          <MuiTextField
            label="Description"
            fullWidth
            multiline
            minRows={3}
            className="sm:col-span-2"
            {...register('description')}
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit(onValid)}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
