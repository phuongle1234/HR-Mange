import { Body, Controller, HttpCode, HttpStatus, Inject, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, CurrentUserPayload } from '../../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { ResponseHelper } from '../../../../common/helpers/response.helper';
import { ApproveWorkflowRequestDto } from '../dto/approve-workflow-request.dto';
import { CancelWorkflowRequestDto } from '../dto/cancel-workflow-request.dto';
import { FeedbackWorkflowRequestDto } from '../dto/feedback-workflow-request.dto';
import { RejectWorkflowRequestDto } from '../dto/reject-workflow-request.dto';
import { ResubmitWorkflowRequestDto } from '../dto/resubmit-workflow-request.dto';
import { IWorkflowActionService } from '../interfaces/workflow-action-service.interface';

@Controller('workflow-requests/:id')
@UseGuards(JwtAuthGuard)
export class WorkflowActionController {
  constructor(@Inject('IWorkflowActionService') private readonly workflowActionService: IWorkflowActionService) {}

  @Post('approve')
  @HttpCode(HttpStatus.OK)
  async approve(@Param('id') id: string, @Body() dto: ApproveWorkflowRequestDto, @CurrentUser() user: CurrentUserPayload) {
    const data = await this.workflowActionService.approve(id, dto, user.id);
    return ResponseHelper.success({ data, message: 'Workflow request approved successfully.' });
  }

  @Post('feedback')
  @HttpCode(HttpStatus.OK)
  async feedback(@Param('id') id: string, @Body() dto: FeedbackWorkflowRequestDto, @CurrentUser() user: CurrentUserPayload) {
    const data = await this.workflowActionService.feedback(id, dto, user.id);
    return ResponseHelper.success({ data, message: 'Workflow request sent back for feedback successfully.' });
  }

  @Post('reject')
  @HttpCode(HttpStatus.OK)
  async reject(@Param('id') id: string, @Body() dto: RejectWorkflowRequestDto, @CurrentUser() user: CurrentUserPayload) {
    const data = await this.workflowActionService.reject(id, dto, user.id);
    return ResponseHelper.success({ data, message: 'Workflow request rejected successfully.' });
  }

  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(@Param('id') id: string, @Body() dto: CancelWorkflowRequestDto, @CurrentUser() user: CurrentUserPayload) {
    const data = await this.workflowActionService.cancel(id, dto, user.id);
    return ResponseHelper.success({ data, message: 'Workflow request cancelled successfully.' });
  }

  @Post('resubmit')
  @HttpCode(HttpStatus.OK)
  async resubmit(@Param('id') id: string, @Body() dto: ResubmitWorkflowRequestDto, @CurrentUser() user: CurrentUserPayload) {
    const data = await this.workflowActionService.resubmit(id, dto, user.id);
    return ResponseHelper.success({ data, message: 'Workflow request resubmitted successfully.' });
  }
}
