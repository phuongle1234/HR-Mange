import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * The ONLY authorization mechanism in this system: "is this a valid,
 * non-expired JWT for an active user" (WORK-000 decision #2 - there is no
 * permission/role model, so no other guard/decorator should gate access).
 * Every protected route in every module uses this same guard.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
