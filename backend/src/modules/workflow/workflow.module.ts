import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WorkflowController } from './controller/workflow.controller';
import { WorkflowRequestController } from './controller/workflow-request.controller';
import { WorkflowService } from './service/workflow.service';
import { WorkflowRequestService } from './service/workflow-request.service';
import { IsValidWorkflowFormSchemaConstraint } from './validators/form-schema.validator';

/**
 * Workflow core: definitions, steps, submit, and reads (WORK-028).
 *
 * WORK-029's action engine, events, and gateway live in their own module and
 * are added here with a single `imports` line at integration - keeping this
 * file single-owner while both agents work in parallel.
 */
@Module({
  imports: [AuthModule],
  controllers: [WorkflowController, WorkflowRequestController],
  providers: [
    WorkflowService,
    {
      provide: 'IWorkflowService',
      useExisting: WorkflowService,
    },
    WorkflowRequestService,
    {
      provide: 'IWorkflowRequestService',
      useExisting: WorkflowRequestService,
    },
    IsValidWorkflowFormSchemaConstraint,
  ],
  exports: ['IWorkflowRequestService', WorkflowRequestService],
})
export class WorkflowModule {}
