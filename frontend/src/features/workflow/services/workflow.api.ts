import { ApiEndpoints } from '../../../shared/api/api-endpoints';
import { baseApiService } from '../../../shared/api/base-api.service';
import type {
  NotificationItem,
  NotificationListResponse,
  Workflow,
  WorkflowListResponse,
  WorkflowListQuery,
  WorkflowRequest,
  WorkflowRequestActionPayload,
  WorkflowRequestListQuery,
  WorkflowRequestListResponse,
  WorkflowStep,
} from '../types/workflow.types';
import { mockNotifications, mockWorkflowList, mockWorkflowRequests } from './__mocks__/workflow.fixtures';

const USE_MOCK_WORKFLOW_API = false;

function buildListMeta(page = 1, limit = 10, total = 1) {
  return { page, limit, total };
}

export const workflowApiService = {
  async list(query?: WorkflowListQuery): Promise<WorkflowListResponse> {
    if (USE_MOCK_WORKFLOW_API) {
      const page = query?.page ?? 1;
      const limit = query?.limit ?? 10;
      const filtered = mockWorkflowList.filter((workflow) => {
        const matchesSearch = !query?.search || `${workflow.name} ${workflow.code}`.toLowerCase().includes(query.search.toLowerCase());
        const matchesStatus = !query?.status || workflow.status === query.status;
        return matchesSearch && matchesStatus;
      });
      return {
        items: filtered.slice((page - 1) * limit, page * limit),
        meta: buildListMeta(page, limit, filtered.length),
      };
    }

    const response = await baseApiService.getWithEnvelope<Workflow[]>(ApiEndpoints.workflows.list(), {
      params: {
        page: query?.page ?? 1,
        limit: query?.limit ?? 10,
        search: query?.search || undefined,
        status: query?.status,
        sortBy: query?.sortBy,
        sortOrder: query?.sortOrder,
      },
    });
    return {
      items: response.data,
      meta: response.meta ?? { page: query?.page ?? 1, limit: query?.limit ?? response.data.length, total: response.data.length },
    };
  },

  async detail(id: string): Promise<Workflow> {
    if (USE_MOCK_WORKFLOW_API) {
      return mockWorkflowList.find((workflow) => workflow.id === id) ?? mockWorkflowList[0];
    }

    return baseApiService.get<Workflow>(ApiEndpoints.workflows.detail(id));
  },

  async create(payload: Partial<Workflow>): Promise<Workflow> {
    if (USE_MOCK_WORKFLOW_API) {
      return {
        ...payload,
        id: `workflow-${Date.now()}`,
        version: 1,
        status: payload.status ?? 'DRAFT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        formSchema: payload.formSchema ?? { fields: [] },
      } as Workflow;
    }

    return baseApiService.post<Workflow>(ApiEndpoints.workflows.create(), payload);
  },

  async update(id: string, payload: Partial<Workflow>): Promise<Workflow> {
    if (USE_MOCK_WORKFLOW_API) {
      return {
        ...(mockWorkflowList.find((workflow) => workflow.id === id) ?? mockWorkflowList[0]),
        ...payload,
        updatedAt: new Date().toISOString(),
      } as Workflow;
    }

    return baseApiService.put<Workflow>(ApiEndpoints.workflows.update(id), payload);
  },

  async replaceSteps(id: string, steps: WorkflowStep[]): Promise<WorkflowStep[]> {
    if (USE_MOCK_WORKFLOW_API) {
      return steps.map((step) => ({ ...step, workflowId: id }));
    }

    return baseApiService.post<WorkflowStep[]>(ApiEndpoints.workflows.replaceSteps(id), {
      steps: steps.map((step) => ({
        name: step.name,
        organizationTypeId: step.organizationTypeId,
      })),
    });
  },
};

export const workflowRequestApiService = {
  async list(query: WorkflowRequestListQuery): Promise<WorkflowRequestListResponse> {
    if (USE_MOCK_WORKFLOW_API) {
      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const scoped = query.scope === 'mine' ? mockWorkflowRequests.slice(0, 1) : mockWorkflowRequests.slice(1);
      const filtered = scoped.filter((request) => {
        const matchesSearch = !query.search || `${request.employeeName ?? ''} ${request.workflow?.name ?? ''}`.toLowerCase().includes(query.search.toLowerCase());
        const matchesStatus = !query.status || request.status === query.status;
        return matchesSearch && matchesStatus;
      });
      return {
        items: filtered.slice((page - 1) * limit, page * limit),
        meta: buildListMeta(page, limit, filtered.length),
      };
    }

    const response = await baseApiService.getWithEnvelope<WorkflowRequest[]>(ApiEndpoints.workflowRequests.list(), {
      params: {
        scope: query.scope,
        page: query.page ?? 1,
        limit: query.limit ?? 10,
        status: query.status,
        workflowId: query.workflowId,
        search: query.search,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      },
    });

    return {
      items: response.data,
      meta: response.meta ?? { page: query.page ?? 1, limit: query.limit ?? response.data.length, total: response.data.length },
    };
  },

  async detail(id: string): Promise<WorkflowRequest> {
    if (USE_MOCK_WORKFLOW_API) {
      return mockWorkflowRequests.find((request) => request.id === id) ?? mockWorkflowRequests[0];
    }

    return baseApiService.get<WorkflowRequest>(ApiEndpoints.workflowRequests.detail(id));
  },

  async create(payload: { workflowId: string; formData: Record<string, unknown> }): Promise<WorkflowRequest> {
    if (USE_MOCK_WORKFLOW_API) {
      const created: WorkflowRequest = {
        id: `request-${Date.now()}`,
        workflowId: payload.workflowId,
        employeeId: 'emp-1',
        employeeName: 'Alice Nguyen',
        currentStepId: 'step-1',
        status: 'IN_PROGRESS',
        formData: payload.formData,
        revision: 1,
        submittedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        workflow: mockWorkflowList.find((workflow) => workflow.id === payload.workflowId) ?? mockWorkflowList[0],
        permissions: { canApprove: true, canReject: true, canFeedback: true, canCancel: false, canResubmit: false },
        history: [{ id: `hist-${Date.now()}`, workflowRequestId: `request-${Date.now()}`, employeeId: 'emp-1', employeeName: 'Alice Nguyen', action: 'SUBMIT', createdAt: new Date().toISOString() }],
      };
      return created;
    }

    return baseApiService.post<WorkflowRequest>(ApiEndpoints.workflowRequests.create(), payload);
  },

  async histories(id: string): Promise<WorkflowRequest['history']> {
    if (USE_MOCK_WORKFLOW_API) {
      const value = mockWorkflowRequests.find((request) => request.id === id)?.history ?? [];
      return value;
    }

    return baseApiService.get<WorkflowRequest['history']>(ApiEndpoints.workflowRequests.histories(id));
  },

  async action(id: string, payload: WorkflowRequestActionPayload): Promise<WorkflowRequest> {
    if (USE_MOCK_WORKFLOW_API) {
      const request = mockWorkflowRequests.find((item) => item.id === id) ?? mockWorkflowRequests[0];
      return {
        ...request,
        revision: payload.revision + 1,
        status: payload.action === 'approve' ? 'APPROVED' : payload.action === 'reject' ? 'REJECTED' : payload.action === 'cancel' ? 'CANCELLED' : 'NEEDS_REVISION',
        updatedAt: new Date().toISOString(),
      };
    }

    const routeMap = {
      approve: ApiEndpoints.workflowRequests.approve(id),
      feedback: ApiEndpoints.workflowRequests.feedback(id),
      reject: ApiEndpoints.workflowRequests.reject(id),
      cancel: ApiEndpoints.workflowRequests.cancel(id),
      resubmit: ApiEndpoints.workflowRequests.resubmit(id),
    };

    const body =
      payload.action === 'resubmit'
        ? {
            revision: payload.revision,
            formData: payload.formData ?? {},
            comment: payload.comment,
          }
        : {
            revision: payload.revision,
            comment: payload.comment,
          };

    return baseApiService.post<WorkflowRequest>(routeMap[payload.action], body);
  },
};

export const notificationApiService = {
  async list(): Promise<NotificationListResponse> {
    if (USE_MOCK_WORKFLOW_API) {
      const unreadCount = mockNotifications.filter((item) => !item.isRead).length;
      return {
        items: mockNotifications,
        meta: {
          page: 1,
          limit: 10,
          total: mockNotifications.length,
          unreadCount,
        },
      };
    }

    const response = await baseApiService.getWithEnvelope<NotificationItem[]>(ApiEndpoints.notifications.list());
    const unreadCount = response.data.filter((item) => !item.isRead).length;
    return {
      items: response.data,
      meta: {
        page: response.meta?.page ?? 1,
        limit: response.meta?.limit ?? response.data.length,
        total: response.meta?.total ?? response.data.length,
        unreadCount: response.meta?.unreadCount ?? unreadCount,
      },
    };
  },

  async markRead(id: string): Promise<NotificationItem> {
    if (USE_MOCK_WORKFLOW_API) {
      const item = mockNotifications.find((notification) => notification.id === id) ?? mockNotifications[0];
      return { ...item, isRead: true };
    }

    return baseApiService.patch<NotificationItem>(ApiEndpoints.notifications.read(id));
  },

  async markAllRead(): Promise<void> {
    if (USE_MOCK_WORKFLOW_API) {
      return;
    }

    await baseApiService.patch<void>(ApiEndpoints.notifications.readAll());
  },
};
