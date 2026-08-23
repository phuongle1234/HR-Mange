/**
 * Central, typed access point for environment variables. Reuses the exact
 * variable names already defined in the repo-root .env.example: APP_PORT,
 * DATABASE_URL, FRONTEND_URL, JWT_ACCESS_SECRET, JWT_ACCESS_EXPIRES_IN,
 * LOG_RETENTION_DAYS. JWT_REFRESH_* exist in the env file but are unused in
 * this phase (no refresh token - stateless bearer JWT only).
 *
 * Nothing outside this module should read `process.env` directly.
 */
export interface AppConfig {
  nodeEnv: string;
  app: {
    port: number;
    frontendUrl: string;
  };
  database: {
    url: string;
  };
  jwt: {
    accessSecret: string;
    accessExpiresIn: string;
  };
  log: {
    retentionDays: number;
  };
}

export default (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  app: {
    port: Number(process.env.APP_PORT ?? 3000),
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  },
  database: {
    url: process.env.DATABASE_URL ?? '',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? '',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  },
  log: {
    retentionDays: Number(process.env.LOG_RETENTION_DAYS ?? 10),
  },
});
