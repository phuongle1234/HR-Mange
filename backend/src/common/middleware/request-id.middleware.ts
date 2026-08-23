import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { REQUEST_ID_HEADER } from '../constants/app.constants';

export interface RequestWithId extends Request {
  requestId: string;
}

/**
 * Assigns a request-correlation id to every inbound request so the global
 * exception filter (and logger) can attach it to error responses/log lines.
 * Reuses an inbound `x-request-id` header when present, otherwise generates
 * a new UUID.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const inboundId = req.headers[REQUEST_ID_HEADER];
    const requestId = typeof inboundId === 'string' && inboundId.length > 0 ? inboundId : randomUUID();

    (req as RequestWithId).requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
  }
}
