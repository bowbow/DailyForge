import { afterEach, describe, expect, it } from 'vitest';

import { healthResponseSchema } from '@daily-forge/contracts';

import { buildApp } from './app.js';

const apps: ReturnType<typeof buildApp>[] = [];

afterEach(async () => {
  await Promise.all(apps.splice(0).map(async (app) => app.close()));
});

describe('health endpoint', () => {
  it('returns a validated healthy response', async () => {
    const app = buildApp();
    apps.push(app);

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
