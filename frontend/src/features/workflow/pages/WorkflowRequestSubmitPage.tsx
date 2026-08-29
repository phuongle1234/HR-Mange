import { useMemo, useState } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import Select from 'react-select';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/components/Button';
import { useWorkflowsQuery } from '../hooks/useWorkflowsQuery';
import { useSubmitWorkflowRequestMutation } from '../hooks/useSubmitWorkflowRequestMutation';
import { DynamicFormRenderer } from '../components/DynamicFormRenderer';

export function WorkflowRequestSubmitPage() {
  const navigate = useNavigate();
  const workflowsQuery = useWorkflowsQuery({ page: 1, limit: 100, status: 'ACTIVE', sortBy: 'name', sortOrder: 'asc' });
  const submitMutation = useSubmitWorkflowRequestMutation();
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('');
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});

  const workflowOptions = useMemo(() => (workflowsQuery.data?.items ?? []).filter((workflow) => workflow.status === 'ACTIVE').map((workflow) => ({ value: workflow.id, label: workflow.name, workflow })), [workflowsQuery.data]);
  const selectedWorkflowOption = workflowOptions.find((option) => option.value === selectedWorkflowId) ?? workflowOptions[0] ?? null;
  const selectedWorkflow = selectedWorkflowOption?.workflow;

  function handleFieldChange(key: string, value: unknown) {
    setFormValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit() {
    if (!selectedWorkflow) {
      return;
    }

    await submitMutation.mutateAsync({ workflowId: selectedWorkflow.id, formData: formValues });
    navigate('/workflow-requests');
  }

  return (
    <Paper elevation={0} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <Box className="flex items-center justify-between">
        <Typography variant="h5" className="!font-black !text-slate-900">Submit Request</Typography>
      </Box>

      <Box className="rounded-xl border border-slate-200 bg-slate-50 p-4 mt-2">
        <Box className="grid grid-cols-12 items-center gap-3">
          <Typography component="label" htmlFor="workflow-select" className="col-span-12 !text-sm !font-bold !text-slate-700 md:col-span-2">Choose workflow</Typography>
          <Box className="col-span-12 md:col-span-10">
            <Select inputId="workflow-select" instanceId="workflow-select" options={workflowOptions} value={selectedWorkflowOption} onChange={(option) => { setSelectedWorkflowId(option?.value ?? ''); setFormValues({}); }} isSearchable isClearable isLoading={workflowsQuery.isLoading} placeholder="Search and select workflow" classNamePrefix="workflow-select" menuPortalTarget={document.body} styles={{ control: (base, state) => ({ ...base, minHeight: 44, borderColor: state.isFocused ? '#22c55e' : '#e2e8f0', boxShadow: state.isFocused ? '0 0 0 4px rgba(34,197,94,0.12)' : 'none', borderRadius: 8 }), menuPortal: (base) => ({ ...base, zIndex: 9999 }) }} />
          </Box>
        </Box>
      </Box>

      {selectedWorkflow && (
        <Box className="space-y-4 mt-2">


          <Box className="rounded-xl border border-slate-200 bg-white p-4">
            <DynamicFormRenderer fields={selectedWorkflow.formSchema.fields} values={formValues} onChange={handleFieldChange} />
          </Box>

          <Box className="flex justify-end">
            <Button type="button" onClick={handleSubmit} disabled={submitMutation.isPending || !selectedWorkflow}>Submit request</Button>
          </Box>
        </Box>
      )}
    </Paper>
  );
}
