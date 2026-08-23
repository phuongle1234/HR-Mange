import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import { createWinstonLogger } from './winston.factory';
import { redactSensitive } from './redact.util';
import { AppConfig } from '../../config/configuration';

/**
 * NestJS-compatible logger backed by winston with daily file rotation.
 * Registered via app.useLogger() in main.ts so Nest's internal logging
 * (startup/shutdown, etc.) goes through the same transport.
 */
@Injectable({ scope: Scope.DEFAULT })
export class AppLoggerService implements LoggerService {
  private readonly winstonLogger: winston.Logger;

  constructor(configService: ConfigService<AppConfig>) {
    const retentionDays = configService.get('log.retentionDays', { infer: true }) ?? 10;
    const nodeEnv = configService.get('nodeEnv', { infer: true }) ?? 'development';
    this.winstonLogger = createWinstonLogger(retentionDays, nodeEnv);
  }

  log(message: unknown, context?: string): void {
    this.winstonLogger.info(this.format(message), { context });
  }

  error(message: unknown, trace?: string, context?: string): void {
    this.winstonLogger.error(this.format(message), { trace, context });
  }

  warn(message: unknown, context?: string): void {
    this.winstonLogger.warn(this.format(message), { context });
  }

  debug(message: unknown, context?: string): void {
    this.winstonLogger.debug(this.format(message), { context });
  }

  verbose(message: unknown, context?: string): void {
    this.winstonLogger.verbose(this.format(message), { context });
  }

  /** Structured, redacted log entry for cases beyond plain string messages. */
  logStructured(level: 'info' | 'warn' | 'error', message: string, meta: Record<string, unknown>): void {
    this.winstonLogger.log(level, message, redactSensitive(meta) as Record<string, unknown>);
  }

  private format(message: unknown): string {
    if (typeof message === 'string') {
      return message;
    }
    return JSON.stringify(redactSensitive(message));
  }
}
