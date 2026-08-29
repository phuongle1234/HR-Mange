import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { PASSWORD_MIN_LENGTH } from '../../../common/constants/app.constants';

/**
 * The raw invitation token is the caller's only credential - this endpoint is
 * unauthenticated, because the account it creates does not exist yet.
 *
 * The password/confirm pair mirrors ChangePasswordDto: length is checked here,
 * while the full policy (letter + number) and the confirm-match check live in
 * the service, matching how AuthService.changePassword already does it.
 */
export class AcceptInvitationDto {
  @IsString()
  @IsNotEmpty({ message: 'token must not be empty.' })
  token!: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH, {
    message: `password must be at least ${PASSWORD_MIN_LENGTH} characters long.`,
  })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'confirmPassword must not be empty.' })
  confirmPassword!: string;
}
