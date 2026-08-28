import { Body, Controller, HttpCode, HttpStatus, Inject, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { ResponseHelper } from '../../../common/helpers/response.helper';
import { CreateInvitationsDto } from '../dto/create-invitations.dto';
import { IInvitationsService } from '../interfaces/invitations-service.interface';

@Controller('invitations')
@UseGuards(JwtAuthGuard)
export class InvitationsController {
  constructor(@Inject('IInvitationsService') private readonly invitationsService: IInvitationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createInvitations(@Body() dto: CreateInvitationsDto, @CurrentUser() user: CurrentUserPayload) {
    const result = await this.invitationsService.createInvitations(dto.employeeIds, user.id);
    return ResponseHelper.success({ data: result, message: 'Invitations registered successfully.' });
  }
}
