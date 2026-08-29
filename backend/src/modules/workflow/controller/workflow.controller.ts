import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { ResponseHelper } from '../../../common/helpers/response.helper';
import { Prisma } from '@prisma/client';
import { CreateWorkflowDto } from '../dto/create-workflow.dto';
import { GetWorkflowsQueryDto } from '../dto/get-workflows-query.dto';
import { ReplaceWorkflowStepsDto } from '../dto/replace-workflow-steps.dto';
import { UpdateWorkflowDto } from '../dto/update-workflow.dto';
import { IWorkflowService } from '../interfaces/workflow-service.interface';

/**
 * Workflow definitions. Every route is authenticated; there is no permission
 * model in this system, so JwtAuthGuard is the whole gate (contract 5).
 */
@Controller('workflows')
@UseGuards(JwtAuthGuard)
export class WorkflowController {
  constructor(@Inject('IWorkflowService') private readonly workflowService: IWorkflowService) {}

  @Get()
  async findMany(@Query() query: GetWorkflowsQueryDto) {
    const { items, total } = await this.workflowService.findMany(query);
    return ResponseHelper.success({
      data: items,
      message: 'Workflows retrieved successfully.',
      meta: { page: query.page, limit: query.limit, total },
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const workflow = await this.workflowService.findOneWithSteps(id);
    return ResponseHelper.success({ data: workflow, message: 'Workflow retrieved successfully.' });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateWorkflowDto, @CurrentUser() user: CurrentUserPayload) {
    await this.workflowService.assertCodeIsAvailable(dto.code);

    const workflow = await this.workflowService.create(
      {
        code: dto.code,
        name: dto.name,
        description: dto.description ?? null,
        formSchema: dto.formSchema as Prisma.InputJsonValue,
        ...(dto.status ? { status: dto.status } : {}),
        createdByUserId: user.id,
      },
      user.id,
    );

    return ResponseHelper.success({ data: workflow, message: 'Workflow created successfully.' });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateWorkflowDto, @CurrentUser() user: CurrentUserPayload) {
    // Only fields actually present in the DTO are forwarded - sending a default
    // for an omitted field would overwrite real data (AGENTS.md bulk-mapping rule).
    const workflow = await this.workflowService.update(
      id,
      {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.formSchema !== undefined ? { formSchema: dto.formSchema as Prisma.InputJsonValue } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
      user.id,
    );

    return ResponseHelper.success({ data: workflow, message: 'Workflow updated successfully.' });
  }

  @Post(':id/steps')
  async replaceSteps(
    @Param('id') id: string,
    @Body() dto: ReplaceWorkflowStepsDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const workflow = await this.workflowService.replaceSteps(id, dto, user.id);
    return ResponseHelper.success({ data: workflow, message: 'Workflow steps replaced successfully.' });
  }
}
