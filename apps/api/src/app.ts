import Fastify from 'fastify';

import { healthResponseSchema } from '@daily-forge/contracts';

export function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
    },
  });

  app.get('/api/v1/health', () =>
    healthResponseSchema.parse({
      service: 'daily-forge-api',
      status: 'ok',
      timestamp: new Date().toISOString(),
    }),
  );

  return app;
}
