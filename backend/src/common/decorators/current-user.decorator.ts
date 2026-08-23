import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserPayload {
  id: string;
  email: string;
  fullName: string;
}

/**
 * Reads the authenticated user off the request, as attached by JwtStrategy.validate().
 * Every authenticated controller in this codebase uses this decorator instead
 * of reaching into `@Req()` directly.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const request = ctx.switchToHttp().getRequest<{ user: CurrentUserPayload }>();
    return request.user;
  },
);
