import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCode } from '../constants/error-code.constant';
import { AppExceptionResponse } from '../exceptions/app.exception';
import { RequestWithId } from '../middleware/request-id.middleware';
import { ResponseHelper } from '../helpers/response.helper';

interface ApiErrorResponseBody {
  statusCode: number;
  code: ErrorCode | string;
  message: string;
  fieldErrors?: Record<string, string[]>;
  requestId?: string;
}

const STATUS_TO_CODE: Record<number, ErrorCode> = {
  [HttpStatus.BAD_REQUEST]: ErrorCode.VALIDATION_ERROR,
  [HttpStatus.UNAUTHORIZED]: ErrorCode.UNAUTHORIZED,
  [HttpStatus.FORBIDDEN]: ErrorCode.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ErrorCode.NOT_FOUND,
  [HttpStatus.CONFLICT]: ErrorCode.CONFLICT,
  [HttpStatus.TOO_MANY_REQUESTS]: ErrorCode.RATE_LIMITED,
};

/**
 * Global exception filter mapping every thrown error to the
 * API-ERROR-RESPONSE envelope: { statusCode, code, message, fieldErrors, requestId }.
 *
 * Never forwards the raw stack trace or internal error message to the
 * client for unexpected (non-HttpException) errors - the root cause is
 * logged server-side only, per docs/02-solution/error-handling.md.
 */
@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request & Partial<RequestWithId>>();
    const response = ctx.getResponse<Response>();
    const requestId = request.requestId;

    const body = this.buildBody(exception, requestId);
    this.logIfUnexpected(exception, body, request);

    response.status(body.statusCode).json(ResponseHelper.error(body));
  }

  private buildBody(exception: unknown, requestId?: string): ApiErrorResponseBody {
    if (exception instanceof HttpException) {
      return this.fromHttpException(exception, requestId);
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred.',
      requestId,
    };
  }

  private fromHttpException(exception: HttpException, requestId?: string): ApiErrorResponseBody {
    const status = exception.getStatus();
    const payload = exception.getResponse();

    if (this.isAppExceptionResponse(payload)) {
      return {
        statusCode: status,
        code: payload.code,
        message: payload.message,
        fieldErrors: payload.fieldErrors,
        requestId,
      };
    }

    // Built-in Nest exceptions (e.g. ValidationPipe's BadRequestException,
    // passport-jwt's UnauthorizedException): fall back to a status-based code.
    const message = this.extractMessage(payload, exception.message);
    return {
      statusCode: status,
      code: STATUS_TO_CODE[status] ?? ErrorCode.INTERNAL_SERVER_ERROR,
      message,
      requestId,
    };
  }

  private isAppExceptionResponse(payload: unknown): payload is AppExceptionResponse {
    return (
      typeof payload === 'object' &&
      payload !== null &&
      'code' in payload &&
      'message' in payload
    );
  }

  private extractMessage(payload: unknown, fallback: string): string {
    if (typeof payload === 'object' && payload !== null && 'message' in payload) {
      const raw = (payload as { message: unknown }).message;
      return Array.isArray(raw) ? raw.join(' ') : String(raw);
    }
    return fallback;
  }

  private logIfUnexpected(exception: unknown, body: ApiErrorResponseBody, request: Request): void {
    if (body.statusCode < HttpStatus.INTERNAL_SERVER_ERROR) {
      return;
    }
    const stack = exception instanceof Error ? exception.stack : undefined;
    this.logger.error(
      `Unhandled exception on ${request.method} ${request.url} [requestId=${body.requestId ?? 'n/a'}]`,
      stack,
    );
  }
}
