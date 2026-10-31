import { afterEach, describe, expect, it } from 'vitest';

import {
  healthResponseSchema,
  historyResponseSchema,
  todayResponseSchema,
  wallResponseSchema,
} from '@daily-forge/contracts';

import { buildApp } from './app.js';
import { DevelopmentStore } from './development-store.js';

const apps: ReturnType<typeof buildApp>[] = [];
const fixedNow = new Date('2026-10-30T18:00:00.000Z');

afterEach(async () => {
  await Promise.all(apps.splice(0).map(async (app) => app.close()));
});

function appForTest() {
  const app = buildApp({
    logger: false,
    store: new DevelopmentStore(() => fixedNow),
  });
  apps.push(app);
  return app;
}

describe('health endpoint', () => {
  it('returns a validated healthy response', async () => {
    const app = appForTest();

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/health',
    });

    expect(response.statusCode).toBe(200);
    expect(healthResponseSchema.parse(response.json())).toMatchObject({
      service: 'daily-forge-api',
      status: 'ok',
    });
  });
});

describe('counter challenge flow', () => {
  it('accepts, records idempotent increments, completes once, and creates one wall entry', async () => {
    const app = appForTest();

    const proposed = todayResponseSchema.parse(
      (
        await app.inject({
          method: 'GET',
          url: '/api/v1/today',
        })
      ).json(),
    );
    expect(proposed.assignment.status).toBe('proposed');

    const accepted = todayResponseSchema.parse(
      (
        await app.inject({
          method: 'POST',
          url: '/api/v1/today/accept',
        })
      ).json(),
    );
    expect(accepted.assignment.status).toBe('accepted');

    const increments = [
      ['11111111-1111-4111-8111-111111111111', 5],
      ['22222222-2222-4222-8222-222222222222', 7],
      ['33333333-3333-4333-8333-333333333333', 8],
    ] as const;
    for (const [eventId, amount] of increments) {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/challenges/development-assignment-today/progress-events',
        payload: {
          eventId,
          amount,
          occurredAt: fixedNow.toISOString(),
        },
      });
      expect(response.statusCode).toBe(200);
    }

    const replay = await app.inject({
      method: 'POST',
      url: '/api/v1/challenges/development-assignment-today/progress-events',
      payload: {
        eventId: increments[0][0],
        amount: increments[0][1],
        occurredAt: fixedNow.toISOString(),
      },
    });
    expect(todayResponseSchema.parse(replay.json()).progress.current).toBe(20);

    const completionPayload = {
      completionId: '44444444-4444-4444-8444-444444444444',
      wallEntryId: '55555555-5555-4555-8555-555555555555',
      completedAt: fixedNow.toISOString(),
      reflection: 'Three small sets made the challenge approachable.',
    };
    const complete = await app.inject({
      method: 'POST',
      url: '/api/v1/challenges/development-assignment-today/complete',
      payload: completionPayload,
    });
    const completed = todayResponseSchema.parse(complete.json());
    expect(completed.assignment.status).toBe('completed');
    expect(completed.streak).toMatchObject({
      current: 1,
      longest: 1,
      lifetimeCompletions: 1,
    });

    const repeatedCompletion = await app.inject({
      method: 'POST',
      url: '/api/v1/challenges/development-assignment-today/complete',
      payload: completionPayload,
    });
    expect(todayResponseSchema.parse(repeatedCompletion.json()).streak.lifetimeCompletions).toBe(1);

    const wall = wallResponseSchema.parse(
      (
        await app.inject({
          method: 'GET',
          url: '/api/v1/wall',
        })
      ).json(),
    );
    expect(wall.entries).toHaveLength(1);
    expect(wall.entries[0]).toMatchObject({
      challengeTitle: 'Accumulate 20 push-ups today',
      result: '20 push-ups',
      reflection: 'Three small sets made the challenge approachable.',
    });

    const history = historyResponseSchema.parse(
      (
        await app.inject({
          method: 'GET',
          url: '/api/v1/history',
        })
      ).json(),
    );
    expect(history.completedLocalDates).toEqual(['2026-10-30']);
  });

  it('rejects completion before the target is reached', async () => {
    const app = appForTest();
    await app.inject({
      method: 'POST',
      url: '/api/v1/today/accept',
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/challenges/development-assignment-today/complete',
      payload: {
        completionId: '44444444-4444-4444-8444-444444444444',
        wallEntryId: '55555555-5555-4555-8555-555555555555',
        completedAt: fixedNow.toISOString(),
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      code: 'target-not-reached',
    });
  });
});
