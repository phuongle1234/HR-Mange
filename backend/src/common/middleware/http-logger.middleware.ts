import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { AppLoggerService } from '../logger/app-logger.service';
import { RequestWithId } from './request-id.middleware';

/**
 * Logs one line per request: method, path, status, duration, requestId.
 * Deliberately never logs the request body (auth endpoints carry
 * passwords/tokens; other endpoints may carry PII), per AGENTS.md and
 * docs/02-solution/logging.md.
 */
@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: AppLoggerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const startedAt = Date.now();

    res.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      const requestId = (req as Partial<RequestWithId>).requestId ?? 'n/a';
      this.logger.log(
        `${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms [requestId=${requestId}]`,
        'HTTP',
      );
    });

    next();
  }
}
