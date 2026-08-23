import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CreateOrganizationsDto } from '../dto/create-organizations.dto';
import { UpdateOrganizationsDto } from '../dto/update-organizations.dto';
import { DeleteOrganizationsDto } from '../dto/delete-organizations.dto';
import { OrganizationFilterDto } from '../dto/organization-filter.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { ResponseHelper } from '../../../common/helpers/response.helper';
import { IOrganizationService } from '../interfaces/organization-service.interface';

/**
 * Only bulk + list operations are exposed here (per the task that requested
 * this module) - no single create/findOne/update/delete route, even though
 * IOrganizationService/BaseService provide them.
 */
@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationController {
  constructor(@Inject('IOrganizationService') private readonly organizationService: IOrganizationService) {}

  @Get()
  async findMany(@Query() query: OrganizationFilterDto) {
    const { items, total } = await this.organizationService.findMany(query);
    return ResponseHelper.success({ data: items, message: 'Organizations retrieved successfully.', meta: { total } });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createMany(@Body() dto: CreateOrganizationsDto, @CurrentUser() user: CurrentUserPayload) {
    const items = dto.items.map((item) => ({
      ...item,
      createdByUserId: user.id,
      updatedByUserId: user.id,
    }));
    const organizations = await this.organizationService.createMany(items, user.id);
    return ResponseHelper.success({ data: organizations, message: 'Organizations created successfully.' });
  }

  @Patch()
  async updateMany(@Body() dto: UpdateOrganizationsDto, @CurrentUser() user: CurrentUserPayload) {
    const data = { ...dto.data, updatedByUserId: user.id };
    const organizations = await this.organizationService.updateMany({ where: dto.where, data }, user.id);
    return ResponseHelper.success({ data: organizations, message: 'Organizations updated successfully.' });
  }

  @Delete()
  async deleteMany(@Body() dto: DeleteOrganizationsDto, @CurrentUser() user: CurrentUserPayload) {
    await this.organizationService.deleteMany({ where: dto.where }, user.id);
    return ResponseHelper.success({ data: null, message: 'Organizations deleted successfully.' });
  }
}
