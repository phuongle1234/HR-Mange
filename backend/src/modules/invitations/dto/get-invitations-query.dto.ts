import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { InvitationStatus } from '@prisma/client';

export class GetInvitationsQueryDto {
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsOptional()
  @IsEnum(InvitationStatus, {
    message: 'status must be one of PENDING, SENT, ACCEPTED, EXPIRED, SEND_FAILED.',
  })
  status?: InvitationStatus;
}
