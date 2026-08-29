import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { ResponseHelper } from '../../../common/helpers/response.helper';
import { CreateWorkflowRequestDto } from '../dto/create-workflow-request.dto';
import { GetWorkflowRequestsQueryDto } from '../dto/get-workflow-requests-query.dto';
import { IWorkflowRequestService } from '../interfaces/workflow-request-service.interface';

/**
 * Workflow requests: submit and read only. The five state-changing actions
 * (approve/feedback/reject/cancel/resubmit) live in WORK-029's action
 * controller, mounted on the same base path.
 */
@Controller('workflow-requests')
@UseGuards(JwtAuthGuard)
export class WorkflowRequestController {
  constructor(@Inject('IWorkflowRequestService') private readonly workflowRequestService: IWorkflowRequestService) {}

  @Get()
  async findMany(@Query() query: GetWorkflowRequestsQueryDto, @CurrentUser() user: CurrentUserPayload) {
    const { items, total } = await this.workflowRequestService.findManyForActor(query, user.id);
    return ResponseHelper.success({
      data: items,
      message: 'Workflow requests retrieved successfully.',
      meta: { page: query.page, limit: query.limit, total },
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async submit(@Body() dto: CreateWorkflowRequestDto, @CurrentUser() user: CurrentUserPayload) {
    const request = await this.workflowRequestService.submit(dto, user.id);
    return ResponseHelper.success({ data: request, message: 'Workflow request submitted successfully.' });
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    const request = await this.workflowRequestService.findOneForActor(id, user.id);
    return ResponseHelper.success({ data: request, message: 'Workflow request retrieved successfully.' });
  }

  @Get(':id/histories')
  async findHistories(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    const histories = await this.workflowRequestService.findHistories(id, user.id);
    return ResponseHelper.success({ data: histories, message: 'Workflow request histories retrieved successfully.' });
  }
}
