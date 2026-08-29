import { Body, Controller, HttpCode, HttpStatus, Inject, Post } from '@nestjs/common';
import { ResponseHelper } from '../../../common/helpers/response.helper';
import { AcceptInvitationDto } from '../dto/accept-invitation.dto';
import { IInvitationsService } from '../interfaces/invitations-service.interface';

/**
 * Mounted at `auth/invitations` rather than alongside InvitationsController
 * for two reasons: the contract pins the route under `/api/auth`
 * (API-AUTH-INVITATIONS-ACCEPT), and InvitationsController applies
 * `JwtAuthGuard` at class level - this endpoint must stay unauthenticated,
 * because the account it creates does not exist yet and the raw token is the
 * caller's only credential.
 *
 * Success returns no access token: the flow redirects to `/login`, it does not
 * log the new user in directly.
 */
@Controller('auth/invitations')
export class InvitationAcceptController {
  constructor(@Inject('IInvitationsService') private readonly invitationsService: IInvitationsService) {}

  @Post('accept')
  @HttpCode(HttpStatus.OK)
  async acceptInvitation(@Body() dto: AcceptInvitationDto) {
    await this.invitationsService.acceptInvitation(dto);
    return ResponseHelper.success({
      data: null,
      message: 'Account created successfully. You can now log in.',
    });
  }
}
