import {
  Employee,
  Prisma,
  Workflow,
  WorkflowAction,
  WorkflowHistory,
  WorkflowRequest,
  WorkflowRequestStatus,
  WorkflowStep,
} from '@prisma/client';
import { WorkflowRequestPermissions } from './workflow-permission.util';

/**
 * The contract 5.6 response shapes, in one place.
 *
 * These must be IDENTICAL across `GET /workflow-requests/:id`, every list row,
 * and all five of WORK-029's action responses - Agent 3 caches by these keys
 * and a divergence silently breaks its cache updates. WORK-029 imports
 * `toWorkflowRequestResponse` rather than rebuilding the object.
 */

export interface WorkflowSummary {
  id: string;
  code: string;
  name: string;
}

export interface EmployeeSummary {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  organizationId: number | null;
}

export interface WorkflowStepSummary {
  id: string;
  name: string;
  organizationTypeId: string;
  parentId: string | null;
}

export interface WorkflowRequestResponse {
  id: string;
  workflowId: string;
  workflow: WorkflowSummary | null;
  employeeId: string;
  employee: EmployeeSummary | null;
  currentStepId: string | null;
  currentStep: WorkflowStepSummary | null;
  status: WorkflowRequestStatus;
  formData: Prisma.JsonValue;
  revision: number;
  submittedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  permissions: WorkflowRequestPermissions;
}

export interface WorkflowHistoryResponse {
  id: string;
  workflowRequestId: string;
  workflowStepId: string | null;
  step: { id: string; name: string } | null;
  employeeId: string;
  employee: { id: string; firstName: string; lastName: string; employeeCode: string } | null;
  action: WorkflowAction;
  comment: string | null;
  createdAt: Date;
}

export function toWorkflowSummary(workflow: Pick<Workflow, 'id' | 'code' | 'name'> | null): WorkflowSummary | null {
  if (!workflow) return null;
  return { id: workflow.id, code: workflow.code, name: workflow.name };
}

export function toEmployeeSummary(
  employee: Pick<Employee, 'id' | 'employeeCode' | 'firstName' | 'lastName' | 'organizationId'> | null,
): EmployeeSummary | null {
  if (!employee) return null;
  return {
    id: employee.id,
    employeeCode: employee.employeeCode,
    firstName: employee.firstName,
    lastName: employee.lastName,
    organizationId: employee.organizationId,
  };
}

export function toWorkflowStepSummary(
  step: Pick<WorkflowStep, 'id' | 'name' | 'organizationTypeId' | 'parentId'> | null,
): WorkflowStepSummary | null {
  if (!step) return null;
  return { id: step.id, name: step.name, organizationTypeId: step.organizationTypeId, parentId: step.parentId };
}

export function toWorkflowRequestResponse(
  request: WorkflowRequest,
  relations: {
    workflow: Pick<Workflow, 'id' | 'code' | 'name'> | null;
    employee: Pick<Employee, 'id' | 'employeeCode' | 'firstName' | 'lastName' | 'organizationId'> | null;
    currentStep: Pick<WorkflowStep, 'id' | 'name' | 'organizationTypeId' | 'parentId'> | null;
  },
  permissions: WorkflowRequestPermissions,
): WorkflowRequestResponse {
  return {
    id: request.id,
    workflowId: request.workflowId,
    workflow: toWorkflowSummary(relations.workflow),
    employeeId: request.employeeId,
    employee: toEmployeeSummary(relations.employee),
    currentStepId: request.currentStepId,
    currentStep: toWorkflowStepSummary(relations.currentStep),
    status: request.status,
    formData: request.formData,
    revision: request.revision,
    submittedAt: request.submittedAt,
    completedAt: request.completedAt,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    permissions,
  };
}

export function toWorkflowHistoryResponse(
  history: WorkflowHistory,
  relations: {
    step: Pick<WorkflowStep, 'id' | 'name'> | null;
    employee: Pick<Employee, 'id' | 'firstName' | 'lastName' | 'employeeCode'> | null;
  },
): WorkflowHistoryResponse {
  return {
    id: history.id,
    workflowRequestId: history.workflowRequestId,
    workflowStepId: history.workflowStepId,
    step: relations.step ? { id: relations.step.id, name: relations.step.name } : null,
    employeeId: history.employeeId,
    employee: relations.employee
      ? {
          id: relations.employee.id,
          firstName: relations.employee.firstName,
          lastName: relations.employee.lastName,
          employeeCode: relations.employee.employeeCode,
        }
      : null,
    action: history.action,
    comment: history.comment,
    createdAt: history.createdAt,
  };
}
