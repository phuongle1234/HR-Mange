import type { WorkflowStep } from '../types/workflow.types';

interface WorkflowStepBuilderProps {
  steps: WorkflowStep[];
  organizationTypes: Array<{ id: string; name: string }>;
  onChange: (steps: WorkflowStep[]) => void;
}

export function WorkflowStepBuilder({ steps, organizationTypes, onChange }: WorkflowStepBuilderProps) {
  const canAppend = steps.length < 20;
  const canRemove = steps.length > 1;

  function getOrganizationTypeName(organizationTypeId: string) {
    return organizationTypes.find((organizationType) => organizationType.id === organizationTypeId)?.name;
  }

  function updateStep(index: number, patch: Partial<WorkflowStep>) {
    onChange(steps.map((step, stepIndex) => (stepIndex === index ? { ...step, ...patch } : step)));
  }

  function updateOrganizationType(index: number, organizationTypeId: string) {
    updateStep(index, { organizationTypeId, organizationTypeName: getOrganizationTypeName(organizationTypeId) });
  }

  function appendStep() {
    if (!canAppend) return;

    const organizationTypeId = organizationTypes[0]?.id ?? '';
    onChange([
      ...steps,
      {
        id: `step-${Date.now()}`,
        workflowId: '',
        parentId: steps.at(-1)?.id ?? null,
        name: `Step ${steps.length + 1}`,
        organizationTypeId,
        organizationTypeName: getOrganizationTypeName(organizationTypeId),
        stepOrder: steps.length + 1,
      },
    ]);
  }

  function removeStep(index: number) {
    if (!canRemove) return;

    onChange(steps.filter((_, stepIndex) => stepIndex !== index));
  }

  return (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <div key={step.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="text-sm font-medium text-slate-700">
              Step Name
              <input value={step.name} onChange={(event) => updateStep(index, { name: event.target.value })} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Organization Type
              <select value={step.organizationTypeId} onChange={(event) => updateOrganizationType(index, event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3">
                {organizationTypes.map((organizationType) => (
                  <option key={organizationType.id} value={organizationType.id}>{organizationType.name}</option>
                ))}
              </select>
            </label>
            <div className="flex items-end justify-end gap-2">
              <button type="button" onClick={() => removeStep(index)} className="rounded-lg border border-danger-200 px-3 py-2 text-sm font-bold text-danger-600 disabled:cursor-not-allowed disabled:opacity-50" disabled={!canRemove}>
                Remove
              </button>
            </div>
          </div>
        </div>
      ))}

      <button type="button" onClick={appendStep} className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700 disabled:cursor-not-allowed disabled:opacity-50" disabled={!canAppend || organizationTypes.length === 0}>
        Add step
      </button>
    </div>
  );
}
