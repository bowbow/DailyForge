import { describe, expect, it } from 'vitest';

import {
  acceptAssignment,
  advanceStreak,
  completeChallenge,
  DomainError,
  progressFor,
  recordProgressEvent,
  replaceAssignment,
} from './challenge';
import {
  type ChallengeDefinition,
  type CountAddedEvent,
  type DailyAssignment,
  type ProgressEvent,
  type StreakState,
} from './types';

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
      increments: [1, 5],
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
    const first = recordProgressEvent(accepted, [], event('event-1', 5));
    const replayed = recordProgressEvent(accepted, first, event('event-1', 5));
    const all = recordProgressEvent(accepted, replayed, event('event-2', 7));

    expect(replayed).toBe(first);
    expect(progressFor(assignment, all)).toMatchObject({ current: 12 });
  });

  it('requires the visible target before completion', () => {
    const accepted = acceptAssignment(assignment, '2026-10-30T17:00:00.000Z');

    expect(() =>
      completeChallenge({
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
    const result = completeChallenge({
      assignment: accepted,
      events: [event('event-1', 5), event('event-2', 7), event('event-3', 8)],
      completionId: 'completion-1',
      wallEntryId: 'entry-1',
      completedAt: '2026-10-30T20:00:00.000Z',
      reflection: 'Small sets made this easy to fit into the day.',
    });

    expect(result.assignment.status).toBe('completed');
    expect(result.completion.progressValue).toBe(20);
    expect(result.wallEntry).toMatchObject({
      challengeTitle: 'Accumulate 20 push-ups today',
      result: '20 push-ups',
      reflection: 'Small sets made this easy to fit into the day.',
    });
  });
});

describe('other tracking policies', () => {
  function withChallenge(challenge: ChallengeDefinition): DailyAssignment {
    return {
      ...assignment,
      id: 'assignment-' + challenge.id,
      challenge,
      status: 'accepted',
      acceptedAt: '2026-10-30T17:00:00.000Z',
    };
  }

  function baseChallenge(
    tracking: ChallengeDefinition['tracking'],
    id: string,
  ): ChallengeDefinition {
    return {
      id,
      version: 1,
      category: 'character',
      title: 'A deliberate action',
      instructions: 'Complete the visible action.',
      practicedQualities: ['prudence'],
      expectedMinutes: 5,
      tracking,
    };
  }

  it('requires each checklist item exactly once', () => {
    const accepted = withChallenge(
      baseChallenge(
        {
          kind: 'checklist',
          items: [
            { id: 'pause', label: 'Pause' },
            { id: 'choose', label: 'Choose deliberately' },
          ],
        },
        'prudence-pause',
      ),
    );
    const first: ProgressEvent = {
      id: 'event-1',
      assignmentId: accepted.id,
      kind: 'checklist-item-completed',
      itemId: 'pause',
      occurredAt: '2026-10-30T18:00:00.000Z',
    };
    const second: ProgressEvent = { ...first, id: 'event-2', itemId: 'choose' };
    const events = recordProgressEvent(accepted, recordProgressEvent(accepted, [], first), second);

    expect(progressFor(accepted, events)).toMatchObject({
      kind: 'checklist',
      completedItemIds: ['pause', 'choose'],
    });
    expect(
      completeChallenge({
        assignment: accepted,
        events,
        completionId: 'completion-checklist',
        wallEntryId: 'wall-checklist',
        completedAt: '2026-10-30T20:00:00.000Z',
      }).wallEntry.result,
    ).toBe('2 deliberate steps completed');
  });

  it('supports confirmation and time progress without mixing policies', () => {
    const confirmation = withChallenge(
      baseChallenge(
        {
          kind: 'confirmation',
          actionLabel: 'I helped',
          resultLabel: 'One useful act',
        },
        'useful-help',
      ),
    );
    const confirmationEvent: ProgressEvent = {
      id: 'event-confirm',
      assignmentId: confirmation.id,
      kind: 'confirmation-recorded',
      occurredAt: '2026-10-30T18:00:00.000Z',
    };
    const events = recordProgressEvent(confirmation, [], confirmationEvent);
    expect(
      completeChallenge({
        assignment: confirmation,
        events,
        completionId: 'completion-confirm',
        wallEntryId: 'wall-confirm',
        completedAt: '2026-10-30T20:00:00.000Z',
      }).wallEntry.result,
    ).toBe('One useful act');

    expect(() =>
      recordProgressEvent(confirmation, [], {
        ...confirmationEvent,
        id: 'wrong-event',
        kind: 'time-added',
        seconds: 300,
      }),
    ).toThrowError(/does not match/);
  });

  it('replaces only an unaccepted proposal', () => {
    const nextChallenge = baseChallenge(
      {
        kind: 'timer',
        targetSeconds: 600,
        incrementsSeconds: [300],
      },
      'constraint-sketch',
    );
    const replacement = replaceAssignment({
      assignment,
      nextAssignmentId: 'assignment-2',
      nextChallenge,
      proposedAt: '2026-10-30T18:00:00.000Z',
    });

    expect(replacement.replaced.status).toBe('replaced');
    expect(replacement.next).toMatchObject({
      id: 'assignment-2',
      status: 'proposed',
      challenge: { id: 'constraint-sketch' },
    });
    expect(() =>
      replaceAssignment({
        assignment: acceptAssignment(assignment, '2026-10-30T17:00:00.000Z'),
        nextAssignmentId: 'assignment-3',
        nextChallenge,
        proposedAt: '2026-10-30T18:00:00.000Z',
      }),
    ).toThrowError(/only be replaced before/);
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
