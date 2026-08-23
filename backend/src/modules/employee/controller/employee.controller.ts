import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
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

  @Delete(':id')
  async delete(@Param() params: EmployeeIdParamDto, @CurrentUser() user: CurrentUserPayload) {
    await this.employeeService.delete(params.id, user.id);
    return ResponseHelper.success({ data: null, message: 'Employee deleted successfully.' });
  }
}
