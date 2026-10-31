import Fastify from 'fastify';
import { ZodError } from 'zod';

import {
  challengeCategorySchema,
  completeChallengeCommandSchema,
  errorResponseSchema,
  healthResponseSchema,
  historyResponseSchema,
  progressEventCommandSchema,
  replaceChallengeCommandSchema,
  todayResponseSchema,
  wallResponseSchema,
} from '@daily-forge/contracts';
import { DomainError } from '@daily-forge/domain';

import { DevelopmentStore } from './development-store.js';

export interface BuildAppOptions {
  store?: DevelopmentStore;
  logger?: boolean;
}

export function buildApp(options: BuildAppOptions = {}) {
  const store = options.store ?? new DevelopmentStore();
  const app = Fastify({
    logger:
      options.logger === false
        ? false
        : {
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

  app.get('/api/v1/today', () => todayResponseSchema.parse(store.getToday()));

  app.post('/api/v1/today/accept', () => todayResponseSchema.parse(store.accept()));

  app.post('/api/v1/today/replace', (request) => {
    replaceChallengeCommandSchema.parse(request.body);
    return todayResponseSchema.parse(store.replace());
  });

  app.post<{ Params: { assignmentId: string } }>(
    '/api/v1/challenges/:assignmentId/progress-events',
    (request) => {
      const command = progressEventCommandSchema.parse(request.body);
      return todayResponseSchema.parse(store.recordProgress(request.params.assignmentId, command));
    },
  );

  app.post<{ Params: { assignmentId: string } }>(
    '/api/v1/challenges/:assignmentId/complete',
    (request) => {
      const command = completeChallengeCommandSchema.parse(request.body);
      return todayResponseSchema.parse(store.complete(request.params.assignmentId, command));
    },
  );

  app.get<{ Querystring: { category?: string } }>('/api/v1/wall', (request) => {
    const category = challengeCategorySchema.optional().parse(request.query.category);
    return wallResponseSchema.parse(store.getWall(category));
  });

  app.get('/api/v1/history', () => historyResponseSchema.parse(store.getHistory()));

  app.post('/api/v1/development/reset', () => todayResponseSchema.parse(store.reset()));

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof DomainError) {
      return reply.status(409).send(
        errorResponseSchema.parse({
          code: error.code,
          message: error.message,
        }),
      );
    }
    if (error instanceof ZodError) {
      return reply.status(400).send(
        errorResponseSchema.parse({
          code: 'invalid-request',
          message: 'The request did not match the expected format.',
        }),
      );
    }
    throw error;
  });

  return app;
}
