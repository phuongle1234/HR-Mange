import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { ResponseHelper } from '../../../common/helpers/response.helper';
import { IOrganizationTypeService } from '../interfaces/organization-type-service.interface';
import { CreateOrganizationTypesDto } from '../dto/create-organization-types.dto';
import { DeleteOrganizationTypesDto } from '../dto/delete-organization-types.dto';
import { GetOrganizationTypesByIdsDto } from '../dto/get-organization-types-by-ids.dto';
import { GetOrganizationTypesQueryDto } from '../dto/get-organization-types-query.dto';
import { UpdateOrganizationTypesDto } from '../dto/update-organization-types.dto';

@Controller('organization-types')
@UseGuards(JwtAuthGuard)
export class OrganizationTypeController {
  constructor(@Inject('IOrganizationTypeService') private readonly organizationTypeService: IOrganizationTypeService) {}

  @Get()
  async findMany(@Query() query: GetOrganizationTypesQueryDto) {
    const { items, total } = await this.organizationTypeService.findMany(query);
    return ResponseHelper.success({
      data: items,
      message: 'Organization types retrieved successfully.',
      meta: { page: query.page, limit: query.limit, total },
    });
  }

  @Post('by-ids')
  async findByIds(@Body() dto: GetOrganizationTypesByIdsDto) {
    const items = await this.organizationTypeService.findByIds(dto.ids);
    return ResponseHelper.success({ data: items, message: 'Organization types retrieved successfully.' });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createMany(@Body() dto: CreateOrganizationTypesDto, @CurrentUser() user: CurrentUserPayload) {
    const items = dto.items.map((item) => ({
      name: item.name,
      description: item.description ?? null,
      createdByUserId: user.id,
      updatedByUserId: user.id,
    }));

    const organizationTypes = await this.organizationTypeService.createMany(items, user.id);
    return ResponseHelper.success({ data: organizationTypes, message: 'Organization types created successfully.' });
  }

  @Patch()
  async updateMany(@Body() dto: UpdateOrganizationTypesDto, @CurrentUser() user: CurrentUserPayload) {
    const items = dto.items.map((item) => ({ id: item.id, data: {name: item?.name || "", description: item?.description || null} }));
    const organizationTypes = await this.organizationTypeService.updateMany(items, user.id);
    return ResponseHelper.success({ data: organizationTypes, message: 'Organization types updated successfully.' });
  }

  @Delete()
  async deleteMany(@Body() dto: DeleteOrganizationTypesDto, @CurrentUser() user: CurrentUserPayload) {
    const deletedCount = await this.organizationTypeService.deleteMany(dto.ids, user.id);
    return ResponseHelper.success({
      data: { deletedCount },
      message: 'Organization types deleted successfully.',
    });
  }
}
