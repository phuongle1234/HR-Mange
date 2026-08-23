import { useEffect } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField as MuiTextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  createOrganizationFormSchema,
  DEFAULT_CREATE_ORGANIZATION_ROW,
} from '../schemas/organization.schemas';
import type { CreateOrganizationFormValues } from '../schemas/organization.schemas';
import { ORGANIZATION_TYPE_LABELS, ORGANIZATION_TYPE_VALUES } from '../types/organization.types';
import type { OrganizationStage } from '../types/organization.types';

interface CreateOrganizationModalProps {
  isOpen: boolean;
  /** Non-null when opened via a node's `[+]` (task §11/§12) - shown readonly. */
  parent: OrganizationStage | null;
  onCancel: () => void;
  onSubmit: (rows: CreateOrganizationFormValues['rows']) => void;
}

/** Task §12/§13/§14/§15/§16 - multi-row Create Organization modal. */
export function CreateOrganizationModal({ isOpen, parent, onCancel, onSubmit }: CreateOrganizationModalProps) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateOrganizationFormValues>({
    resolver: zodResolver(createOrganizationFormSchema),
    defaultValues: { rows: [DEFAULT_CREATE_ORGANIZATION_ROW] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'rows' });

  useEffect(() => {
    if (isOpen) {
      reset({ rows: [DEFAULT_CREATE_ORGANIZATION_ROW] });
    }
  }, [isOpen, reset]);

  function onValid(values: CreateOrganizationFormValues) {
    onSubmit(values.rows);
  }

  const rootErrorMessage = typeof errors.rows?.message === 'string' ? errors.rows.message : undefined;

  return (
    <Dialog open={isOpen} onClose={onCancel} maxWidth="md" fullWidth>
      <DialogTitle>Add Organization</DialogTitle>
      <DialogContent>
        {parent && (
          <div className="mb-4">
            <p className="mb-1 text-xs font-bold uppercase text-slate-500">Parent Organization</p>
            <Chip label={parent.name} />
          </div>
        )}

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fields.map((field, index) => (
              <TableRow key={field.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <MuiTextField
                    size="small"
                    fullWidth
                    error={Boolean(errors.rows?.[index]?.code)}
                    helperText={errors.rows?.[index]?.code?.message}
                    {...register(`rows.${index}.code` as const)}
                  />
                </TableCell>
                <TableCell>
                  <MuiTextField
                    size="small"
                    fullWidth
                    error={Boolean(errors.rows?.[index]?.name)}
                    helperText={errors.rows?.[index]?.name?.message}
                    {...register(`rows.${index}.name` as const)}
                  />
                </TableCell>
                <TableCell>
                  <Controller
                    control={control}
                    name={`rows.${index}.type` as const}
                    render={({ field: selectField }) => (
                      <FormControl size="small" fullWidth>
                        <Select {...selectField}>
                          {ORGANIZATION_TYPE_VALUES.map((type) => (
                            <MenuItem key={type} value={type}>
                              {ORGANIZATION_TYPE_LABELS[type]}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    aria-label="Remove row"
                    disabled={fields.length <= 1}
                    onClick={() => remove(index)}
                  >
                    <DeleteIcon fontSize="inherit" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Button
          type="button"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => append(DEFAULT_CREATE_ORGANIZATION_ROW)}
          sx={{ mt: 2 }}
        >
          Add Row
        </Button>

        {rootErrorMessage && (
          <p role="alert" className="mt-2 text-sm font-semibold text-red-600">
            {rootErrorMessage}
          </p>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit(onValid)}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}
