import { describe, expect, it } from 'vitest';

import {
  acceptAssignment,
  addCountEvent,
  advanceStreak,
  completeCounterChallenge,
  countProgress,
  DomainError,
} from './challenge';
import { type CountAddedEvent, type DailyAssignment, type StreakState } from './types';

const assignment: DailyAssignment = {
  id: 'assignment-1',
  userId: 'development-user',
  localDate: '2026-10-30',
  timeZone: 'America/Los_Angeles',
  status: 'proposed',
  proposedAt: '2026-10-30T15:00:00.000Z',
  challenge: {
    id: 'push-ups-20',
    version: 1,
    category: 'body',
    title: 'Accumulate 20 push-ups today',
    instructions: 'Use any safe variation and split the total into small sets.',
    practicedQualities: ['consistency'],
    expectedMinutes: 3,
    safetyNote: 'Stop if you feel pain.',
    tracking: {
      kind: 'counter',
      target: 20,
      unit: 'push-ups',
    },
  },
};

function event(id: string, amount: number): CountAddedEvent {
  return {
    id,
    assignmentId: assignment.id,
    kind: 'count-added',
    amount,
    occurredAt: '2026-10-30T18:00:00.000Z',
  };
}

describe('counter challenge', () => {
  it('accepts once and records idempotent progress', () => {
    const accepted = acceptAssignment(assignment, '2026-10-30T17:00:00.000Z');
    const first = addCountEvent(accepted, [], event('event-1', 5));
    const replayed = addCountEvent(accepted, first, event('event-1', 5));
    const all = addCountEvent(accepted, replayed, event('event-2', 7));

    expect(replayed).toBe(first);
    expect(countProgress(assignment.id, all)).toBe(12);
  });

  it('requires the visible target before completion', () => {
    const accepted = acceptAssignment(assignment, '2026-10-30T17:00:00.000Z');

    expect(() =>
      completeCounterChallenge({
        assignment: accepted,
        events: [event('event-1', 19)],
        completionId: 'completion-1',
        wallEntryId: 'entry-1',
        completedAt: '2026-10-30T20:00:00.000Z',
      }),
    ).toThrowError(
      new DomainError(
        'target-not-reached',
        'The visible challenge target has not been reached yet.',
      ),
    );
  });

  it('creates a historical wall snapshot at completion', () => {
    const accepted = acceptAssignment(assignment, '2026-10-30T17:00:00.000Z');
    const result = completeCounterChallenge({
      assignment: accepted,
      events: [event('event-1', 5), event('event-2', 7), event('event-3', 8)],
      completionId: 'completion-1',
      wallEntryId: 'entry-1',
      completedAt: '2026-10-30T20:00:00.000Z',
      reflection: 'Small sets made this easy to fit into the day.',
    });

    expect(result.assignment.status).toBe('completed');
    expect(result.completion.total).toBe(20);
    expect(result.wallEntry).toMatchObject({
      challengeTitle: 'Accumulate 20 push-ups today',
      result: '20 push-ups',
      reflection: 'Small sets made this easy to fit into the day.',
    });
  });
});

describe('streaks', () => {
  it('advances once per local date and preserves the longest streak', () => {
    const initial: StreakState = {
      current: 0,
      longest: 0,
      lifetimeCompletions: 0,
    };
    const first = advanceStreak(initial, '2026-10-30');
    const replay = advanceStreak(first, '2026-10-30');
    const consecutive = advanceStreak(replay, '2026-10-31');
    const reset = advanceStreak(consecutive, '2026-11-02');

    expect(replay).toEqual(first);
    expect(consecutive).toMatchObject({
      current: 2,
      longest: 2,
      lifetimeCompletions: 2,
    });
    expect(reset).toMatchObject({
      current: 1,
      longest: 2,
      lifetimeCompletions: 3,
    });
  });
});
