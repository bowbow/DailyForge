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
  const app = buildApp({ logger: false, store: new DevelopmentStore(() => fixedNow, false) });
  apps.push(app);
  return app;
}

function appWithDemoHistory() {
  const app = buildApp({ logger: false, store: new DevelopmentStore(() => fixedNow) });
  apps.push(app);
  return app;
}

describe('health and daily assignments', () => {
  it('returns a validated healthy response', async () => {
    const response = await appForTest().inject({ method: 'GET', url: '/api/v1/health' });
    expect(response.statusCode).toBe(200);
    expect(healthResponseSchema.parse(response.json())).toMatchObject({
      service: 'daily-forge-api',
      status: 'ok',
    });
  });

  it('offers one independent challenge in every category', async () => {
    const response = await appForTest().inject({ method: 'GET', url: '/api/v1/today' });
    const today = todayResponseSchema.parse(response.json());

    expect(today.challenges).toHaveLength(4);
    expect(today.challenges.map(({ assignment }) => assignment.challenge.category)).toEqual([
      'body',
      'character',
      'community',
      'creativity',
    ]);
    expect(today.challenges.every(({ assignment }) => assignment.status === 'proposed')).toBe(true);
    expect(today.creativityProgram).toMatchObject({
      version: '0.1',
      activeWork: {
        id: 'mountain-atmosphere-immensity',
        status: 'active',
      },
    });
    const creativity = today.challenges.find(
      ({ assignment }) => assignment.challenge.category === 'creativity',
    );
    expect(creativity?.assignment.challenge).toMatchObject({
      id: 'CR-P-001',
      expectedMinutes: 15,
      creativity: {
        goalIds: ['CG-01', 'CG-04'],
        primaryHabit: 'express',
        studioStructure: 'work',
      },
    });
  });

  it('updates active creative work independently of streak and challenge completion', async () => {
    const app = appForTest();
    const pausedResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/creativity/active-work/status',
      payload: { status: 'paused' },
    });
    const paused = todayResponseSchema.parse(pausedResponse.json());

    expect(paused.creativityProgram.activeWork.status).toBe('paused');
    expect(paused.streak).toMatchObject({ current: 0, lifetimeCompletions: 0 });
    expect(paused.challenges.every(({ assignment }) => assignment.status === 'proposed')).toBe(
      true,
    );

    const continuedResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/creativity/active-work/status',
      payload: { status: 'active' },
    });
    expect(
      todayResponseSchema.parse(continuedResponse.json()).creativityProgram.activeWork.status,
    ).toBe('active');

    const invalid = await app.inject({
      method: 'POST',
      url: '/api/v1/creativity/active-work/status',
      payload: { status: 'discarded' },
    });
    expect(invalid.statusCode).toBe(400);
  });

  it('seeds believable development history without changing today’s assignments', async () => {
    const app = appWithDemoHistory();
    const wall = wallResponseSchema.parse(
      (await app.inject({ method: 'GET', url: '/api/v1/wall' })).json(),
    );
    const history = historyResponseSchema.parse(
      (await app.inject({ method: 'GET', url: '/api/v1/history' })).json(),
    );
    const today = todayResponseSchema.parse(
      (await app.inject({ method: 'GET', url: '/api/v1/today' })).json(),
    );

    expect(wall.entries).toHaveLength(14);
    expect(new Set(wall.entries.map((entry) => entry.localDate)).size).toBe(8);
    expect(wall.entries.some((entry) => entry.reflection)).toBe(true);
    expect(history).toMatchObject({
      streak: { current: 2, longest: 3, lifetimeCompletions: 14 },
      completionsByCategory: { body: 4, character: 3, community: 3, creativity: 4 },
    });
    expect(today.challenges.every(({ assignment }) => assignment.status === 'proposed')).toBe(true);
  });
});

describe('multiple daily challenge flow', () => {
  it('completes two categories while advancing the day streak only once', async () => {
    const app = appForTest();
    const bodyId = 'development-assignment-body';
    const characterId = 'development-assignment-character';

    await app.inject({ method: 'POST', url: `/api/v1/challenges/${bodyId}/accept` });
    for (const [eventId, amount] of [
      ['11111111-1111-4111-8111-111111111111', 5],
      ['22222222-2222-4222-8222-222222222222', 5],
      ['33333333-3333-4333-8333-333333333333', 5],
      ['44444444-4444-4444-8444-444444444444', 5],
    ] as const) {
      await app.inject({
        method: 'POST',
        url: `/api/v1/challenges/${bodyId}/progress-events`,
        payload: { eventId, kind: 'count-added', amount, occurredAt: fixedNow.toISOString() },
      });
    }
    const bodyCompletion = {
      completionId: '55555555-5555-4555-8555-555555555555',
      wallEntryId: '66666666-6666-4666-8666-666666666666',
      completedAt: fixedNow.toISOString(),
      reflection: 'Small sets fit naturally into the day.',
    };
    await app.inject({
      method: 'POST',
      url: `/api/v1/challenges/${bodyId}/complete`,
      payload: bodyCompletion,
    });

    await app.inject({ method: 'POST', url: `/api/v1/challenges/${characterId}/accept` });
    for (const [index, itemId] of [
      'name-choice',
      'consider-effects',
      'choose-deliberately',
    ].entries()) {
      await app.inject({
        method: 'POST',
        url: `/api/v1/challenges/${characterId}/progress-events`,
        payload: {
          eventId: `77777777-7777-4777-8777-77777777777${index}`,
          kind: 'checklist-item-completed',
          itemId,
          occurredAt: fixedNow.toISOString(),
        },
      });
    }
    const characterCompletion = await app.inject({
      method: 'POST',
      url: `/api/v1/challenges/${characterId}/complete`,
      payload: {
        completionId: '88888888-8888-4888-8888-888888888888',
        wallEntryId: '99999999-9999-4999-8999-999999999999',
        completedAt: fixedNow.toISOString(),
      },
    });
    const completed = todayResponseSchema.parse(characterCompletion.json());

    expect(completed.streak).toMatchObject({
      current: 1,
      longest: 1,
      lifetimeCompletions: 2,
    });
    expect(
      completed.challenges.filter(({ assignment }) => assignment.status === 'completed'),
    ).toHaveLength(2);

    const replay = await app.inject({
      method: 'POST',
      url: `/api/v1/challenges/${characterId}/complete`,
      payload: {
        completionId: '88888888-8888-4888-8888-888888888888',
        wallEntryId: '99999999-9999-4999-8999-999999999999',
        completedAt: fixedNow.toISOString(),
      },
    });
    expect(todayResponseSchema.parse(replay.json()).streak.lifetimeCompletions).toBe(2);

    const wall = wallResponseSchema.parse(
      (await app.inject({ method: 'GET', url: '/api/v1/wall' })).json(),
    );
    expect(wall.entries).toHaveLength(2);
    expect(wall.entries.map((entry) => entry.category).sort()).toEqual(['body', 'character']);

    const history = historyResponseSchema.parse(
      (await app.inject({ method: 'GET', url: '/api/v1/history' })).json(),
    );
    expect(history.completedLocalDates).toEqual(['2026-10-30']);
    expect(history.completionsByCategory).toEqual({
      body: 1,
      character: 1,
      community: 0,
      creativity: 0,
    });
  });

  it('replaces only the selected category and keeps that category stable', async () => {
    const app = appForTest();
    const before = todayResponseSchema.parse(
      (await app.inject({ method: 'GET', url: '/api/v1/today' })).json(),
    );
    const body = before.challenges.find(
      ({ assignment }) => assignment.challenge.category === 'body',
    )!;
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/challenges/${body.assignment.id}/replace`,
      payload: {},
    });
    const after = todayResponseSchema.parse(response.json());
    const nextBody = after.challenges.find(
      ({ assignment }) => assignment.challenge.category === 'body',
    )!;

    expect(nextBody).toMatchObject({
      replacementCount: 1,
      assignment: {
        status: 'proposed',
        challenge: { id: 'mobility-reset-5', category: 'body' },
      },
      progress: { kind: 'timer' },
    });
    expect(
      after.challenges
        .filter(({ assignment }) => assignment.challenge.category !== 'body')
        .map(({ assignment }) => assignment.id),
    ).toEqual(
      before.challenges
        .filter(({ assignment }) => assignment.challenge.category !== 'body')
        .map(({ assignment }) => assignment.id),
    );
  });

  it('skips one area without affecting the other three', async () => {
    const app = appForTest();
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/challenges/development-assignment-community/skip',
      payload: {},
    });
    const today = todayResponseSchema.parse(response.json());

    expect(
      today.challenges.find(({ assignment }) => assignment.challenge.category === 'community')
        ?.assignment.status,
    ).toBe('skipped');
    expect(
      today.challenges.filter(({ assignment }) => assignment.status === 'proposed'),
    ).toHaveLength(3);
    expect(today.streak).toMatchObject({ current: 0, lifetimeCompletions: 0 });
  });
});

describe('validation', () => {
  it('rejects completion before the visible target is reached', async () => {
    const app = appForTest();
    const id = 'development-assignment-body';
    await app.inject({ method: 'POST', url: `/api/v1/challenges/${id}/accept` });
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/challenges/${id}/complete`,
      payload: {
        completionId: '11111111-1111-4111-8111-111111111111',
        wallEntryId: '22222222-2222-4222-8222-222222222222',
        completedAt: fixedNow.toISOString(),
      },
    });
    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ code: 'target-not-reached' });
  });

  it('rejects malformed, mismatched, and unknown commands', async () => {
    const app = appForTest();
    const id = 'development-assignment-body';
    await app.inject({ method: 'POST', url: `/api/v1/challenges/${id}/accept` });

    const malformed = await app.inject({
      method: 'POST',
      url: `/api/v1/challenges/${id}/progress-events`,
      payload: {
        eventId: '11111111-1111-4111-8111-111111111111',
        amount: 5,
        occurredAt: fixedNow.toISOString(),
      },
    });
    expect(malformed.statusCode).toBe(400);

    const wrongPolicy = await app.inject({
      method: 'POST',
      url: `/api/v1/challenges/${id}/progress-events`,
      payload: {
        eventId: '22222222-2222-4222-8222-222222222222',
        kind: 'time-added',
        seconds: 300,
        occurredAt: fixedNow.toISOString(),
      },
    });
    expect(wrongPolicy.statusCode).toBe(409);
    expect(wrongPolicy.json()).toMatchObject({ code: 'tracking-policy-mismatch' });

    const unknown = await app.inject({
      method: 'POST',
      url: '/api/v1/challenges/not-real/accept',
    });
    expect(unknown.statusCode).toBe(409);
    expect(unknown.json()).toMatchObject({ code: 'assignment-not-found' });
  });
});
