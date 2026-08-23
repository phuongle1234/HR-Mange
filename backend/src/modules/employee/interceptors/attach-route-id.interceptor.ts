import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Copies the route `:id` param onto the request body as `id` before the
 * global ValidationPipe runs (interceptors execute before pipes), so
 * IsEmployeeCodeUnique/IsEmployeeEmailUnique can read the current record's id
 * via `args.object.id` and exclude it from the uniqueness check on update.
 */
@Injectable()
export class AttachRouteIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    if (request.params?.id && request.body && typeof request.body === 'object') {
      request.body.id = request.params.id;
    }
    return next.handle();
  }
}
