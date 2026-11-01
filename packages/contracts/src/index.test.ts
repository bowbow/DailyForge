import { describe, expect, it } from 'vitest';

import {
  creativeWorkStatusCommandSchema,
  creativityChallengeContextSchema,
  completeChallengeCommandSchema,
  progressEventCommandSchema,
  trackingPolicySchema,
} from './index';

const eventId = '11111111-1111-4111-8111-111111111111';
const occurredAt = '2026-10-30T18:00:00.000Z';

describe('progress event commands', () => {
  it.each([
    { eventId, occurredAt, kind: 'count-added', amount: 5 },
    { eventId, occurredAt, kind: 'confirmation-recorded' },
    { eventId, occurredAt, kind: 'checklist-item-completed', itemId: 'pause' },
    { eventId, occurredAt, kind: 'time-added', seconds: 300 },
  ])('accepts $kind', (command) => {
    expect(progressEventCommandSchema.parse(command)).toEqual(command);
  });

  it('rejects missing discriminators and non-positive values', () => {
    expect(() => progressEventCommandSchema.parse({ eventId, occurredAt, amount: 5 })).toThrow();
    expect(() =>
      progressEventCommandSchema.parse({
        eventId,
        occurredAt,
        kind: 'time-added',
        seconds: 0,
      }),
    ).toThrow();
  });
});

describe('creativity program contracts', () => {
  it('validates Studio Thinking metadata and bounded active-work status commands', () => {
    expect(
      creativityChallengeContextSchema.parse({
        programVersion: '0.1',
        goalIds: ['CG-01', 'CG-04'],
        lane: 'project',
        primaryHabit: 'express',
        supportingHabits: ['envision'],
        studioStructure: 'work',
        reflectionPrompt: 'What creates the intended effect?',
        activeWorkId: 'mountain-atmosphere-immensity',
      }),
    ).toMatchObject({ primaryHabit: 'express', goalIds: ['CG-01', 'CG-04'] });
    expect(creativeWorkStatusCommandSchema.parse({ status: 'paused' })).toEqual({
      status: 'paused',
    });
    expect(() => creativeWorkStatusCommandSchema.parse({ status: 'deleted' })).toThrow();
  });
});

describe('challenge and completion contracts', () => {
  it('requires a non-empty checklist', () => {
    expect(() => trackingPolicySchema.parse({ kind: 'checklist', items: [] })).toThrow();
  });

  it('trims a bounded private reflection', () => {
    const parsed = completeChallengeCommandSchema.parse({
      completionId: '22222222-2222-4222-8222-222222222222',
      wallEntryId: '33333333-3333-4333-8333-333333333333',
      completedAt: occurredAt,
      reflection: '  A deliberate pause helped.  ',
    });

    expect(parsed.reflection).toBe('A deliberate pause helped.');
    expect(() =>
      completeChallengeCommandSchema.parse({
        ...parsed,
        reflection: 'x'.repeat(1001),
      }),
    ).toThrow();
  });
});
