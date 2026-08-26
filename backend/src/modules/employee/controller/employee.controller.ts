import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { EmployeeService } from '../service/employee.service';
import { CreateEmployeeDto } from '../dto/create-employee.dto';
import { UpdateEmployeeDto } from '../dto/update-employee.dto';
import { GetEmployeesQueryDto } from '../dto/get-employees-query.dto';
import { EmployeeIdParamDto } from '../dto/employee-id-param.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { ResponseHelper } from '../../../common/helpers/response.helper';
import { IEmployeeService } from '../interfaces/employee-service.interface';
import { AttachRouteIdInterceptor } from '../interceptors/attach-route-id.interceptor';
import { BulkCreateEmployeesDto } from '../dto/bulk-create-employees.dto';
import { BulkUpdateEmployeesDto } from '../dto/bulk-update-employees.dto';
import { BulkDeleteEmployeesDto } from '../dto/bulk-delete-employees.dto';
import { GetEmployeesByIdsDto } from '../dto/get-employees-by-ids.dto';

/**
 * Every route here uses JwtAuthGuard only - no permission/role guard exists
 * in this system (WORK-000 decision #2).
 */
@Controller('employees')
@UseGuards(JwtAuthGuard)
export class EmployeeController {
  constructor(@Inject('IEmployeeService') private readonly employeeService: IEmployeeService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateEmployeeDto, @CurrentUser() user: CurrentUserPayload) {
    const data = { ...dto, createdByUserId: user.id, updatedByUserId: user.id };
    const employee = await this.employeeService.create(data, user.id);
    return ResponseHelper.success({ data: employee, message: 'Employee created successfully.' });
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  async createMany(@Body() dto: BulkCreateEmployeesDto, @CurrentUser() user: CurrentUserPayload) {
    const items = dto.items.map((item) => ({ ...item, createdByUserId: user.id, updatedByUserId: user.id }));
    const employees = await this.employeeService.createMany(items, user.id);
    return ResponseHelper.success({ data: employees, message: 'Employees created successfully.' });
  }

  @Get()
  async findMany(@Query() query: GetEmployeesQueryDto) {
    const { items, total } = await this.employeeService.findMany(query);
    return ResponseHelper.success({
      data: items,
      message: 'Employees retrieved successfully.',
      meta: { page: query.page, limit: query.limit, total },
    });
  }

  @Get(':id')
  async findOne(@Param() params: EmployeeIdParamDto) {
    const employee = await this.employeeService.findOne(params.id);
    return ResponseHelper.success({ data: employee, message: 'Employee retrieved successfully.' });
  }

  @Post('by-ids')
  async findByIds(@Body() dto: GetEmployeesByIdsDto) {
    const employees = await this.employeeService.findByIds(dto.ids);
    return ResponseHelper.success({ data: employees, message: 'Employees retrieved successfully.' });
  }

  @Put(':id')
  @UseInterceptors(AttachRouteIdInterceptor)
  async update(
    @Param() params: EmployeeIdParamDto,
    @Body() dto: UpdateEmployeeDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    // dto.id is populated by AttachRouteIdInterceptor for
    // IsEmployeeCodeUnique/IsEmployeeEmailUnique only - it is not business
    // data and must never reach the service/persistence layer.
    const { id: _validatorOnly, ...rest } = dto;
    const data = { ...rest, updatedByUserId: user.id };
    const employee = await this.employeeService.update(params.id, data, user.id);
    return ResponseHelper.success({ data: employee, message: 'Employee updated successfully.' });
  }

  @Patch('bulk')
  async updateMany(@Body() dto: BulkUpdateEmployeesDto, @CurrentUser() user: CurrentUserPayload) {
    await this.employeeService.findByIds(dto.items.map((item) => item.id));
    const items = dto.items.map((item) => {
      const { id, ...data } = item;
      return { id, data: { ...data, updatedByUserId: user.id } };
    });
    const employees = await this.employeeService.updateMany(items, user.id);
    return ResponseHelper.success({ data: employees, message: 'Employees updated successfully.' });
  }

  @Delete('bulk')
  async deleteMany(@Body() dto: BulkDeleteEmployeesDto, @CurrentUser() user: CurrentUserPayload) {
    await this.employeeService.findByIds(dto.ids);
    const deletedCount = await this.employeeService.deleteMany(dto.ids, user.id);
    return ResponseHelper.success({ data: { deletedCount }, message: 'Employees deleted successfully.' });
  }

  @Delete(':id')
  async delete(@Param() params: EmployeeIdParamDto, @CurrentUser() user: CurrentUserPayload) {
    await this.employeeService.delete(params.id, user.id);
    return ResponseHelper.success({ data: null, message: 'Employee deleted successfully.' });
  }
}
