import * as winston from 'winston';
import 'winston-daily-rotate-file';
import * as path from 'path';

/**
 * Daily-rotating file logger. Retains only the latest N days (LOG_RETENTION_DAYS,
 * default 10) per docs/02-solution/logging.md. Files are written under
 * backend/logs/, which is gitignored.
 */
export function createWinstonLogger(retentionDays: number, nodeEnv: string): winston.Logger {
  const logsDir = path.join(process.cwd(), 'logs');

  const fileTransport = new winston.transports.DailyRotateFile({
    dirname: logsDir,
    filename: 'application-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxFiles: `${retentionDays}d`,
    zippedArchive: false,
  });

  const transports: winston.transport[] = [fileTransport];

  if (nodeEnv !== 'production') {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
      }),
    );
  }

  return winston.createLogger({
    level: 'info',
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    transports,
  });
}
