import {
  type ChallengeDefinition,
  type Completion,
  type DailyAssignment,
  type GoodnessEntry,
  type ProgressEvent,
  type ProgressState,
  type StreakState,
} from './types';

export class DomainError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export function acceptAssignment(assignment: DailyAssignment, acceptedAt: string): DailyAssignment {
  if (assignment.status === 'accepted' || assignment.status === 'completed') {
    return assignment;
  }
  if (assignment.status !== 'proposed') {
    throw new DomainError(
      'assignment-not-available',
      'This challenge is no longer available to accept.',
    );
  }
  return { ...assignment, status: 'accepted', acceptedAt };
}

export function skipAssignment(assignment: DailyAssignment, skippedAt: string): DailyAssignment {
  if (assignment.status === 'skipped') {
    return assignment;
  }
  if (assignment.status !== 'proposed') {
    throw new DomainError(
      'skip-not-available',
      'A challenge can only be skipped before it is accepted.',
    );
  }
  return { ...assignment, status: 'skipped', skippedAt };
}

export interface ReplaceAssignmentInput {
  assignment: DailyAssignment;
  nextAssignmentId: string;
  nextChallenge: ChallengeDefinition;
  proposedAt: string;
}

export function replaceAssignment(input: ReplaceAssignmentInput): {
  replaced: DailyAssignment;
  next: DailyAssignment;
} {
  if (input.assignment.status !== 'proposed') {
    throw new DomainError(
      'replacement-not-available',
      'A challenge can only be replaced before it is accepted.',
    );
  }
  return {
    replaced: { ...input.assignment, status: 'replaced' },
    next: {
      ...input.assignment,
      id: input.nextAssignmentId,
      challenge: input.nextChallenge,
      proposedAt: input.proposedAt,
    },
  };
}

export function recordProgressEvent(
  assignment: DailyAssignment,
  existingEvents: ProgressEvent[],
  event: ProgressEvent,
): ProgressEvent[] {
  if (existingEvents.some((existing) => existing.id === event.id)) {
    return existingEvents;
  }
  if (assignment.status !== 'accepted') {
    throw new DomainError(
      'assignment-not-accepted',
      'Accept this challenge before adding progress.',
    );
  }
  if (event.assignmentId !== assignment.id) {
    throw new DomainError(
      'assignment-mismatch',
      'This progress event belongs to a different challenge.',
    );
  }

  const policy = assignment.challenge.tracking;
  if (policy.kind === 'counter' && event.kind === 'count-added') {
    assertPositiveInteger(
      event.amount,
      'invalid-count',
      'Progress must be a positive whole number.',
    );
  } else if (policy.kind === 'confirmation' && event.kind === 'confirmation-recorded') {
    // The event itself is the durable confirmation.
  } else if (policy.kind === 'checklist' && event.kind === 'checklist-item-completed') {
    if (!policy.items.some((item) => item.id === event.itemId)) {
      throw new DomainError(
        'unknown-checklist-item',
        'That checklist item is not part of this challenge.',
      );
    }
    if (
      existingEvents.some(
        (existing) =>
          existing.kind === 'checklist-item-completed' && existing.itemId === event.itemId,
      )
    ) {
      return existingEvents;
    }
  } else if (policy.kind === 'timer' && event.kind === 'time-added') {
    assertPositiveInteger(
      event.seconds,
      'invalid-time',
      'Time must be a positive whole number of seconds.',
    );
  } else {
    throw new DomainError(
      'tracking-policy-mismatch',
      'This progress event does not match the challenge tracking method.',
    );
  }

  return [...existingEvents, event];
}

export function progressFor(assignment: DailyAssignment, events: ProgressEvent[]): ProgressState {
  const relevant = events.filter((event) => event.assignmentId === assignment.id);
  const policy = assignment.challenge.tracking;
  switch (policy.kind) {
    case 'counter':
      return {
        kind: 'counter',
        current: relevant.reduce(
          (total, event) => total + (event.kind === 'count-added' ? event.amount : 0),
          0,
        ),
        target: policy.target,
        unit: policy.unit,
        increments: policy.increments,
      };
    case 'confirmation':
      return {
        kind: 'confirmation',
        confirmed: relevant.some((event) => event.kind === 'confirmation-recorded'),
        actionLabel: policy.actionLabel,
      };
    case 'checklist':
      return {
        kind: 'checklist',
        completedItemIds: relevant.flatMap((event) =>
          event.kind === 'checklist-item-completed' ? [event.itemId] : [],
        ),
        items: policy.items,
      };
    case 'timer':
      return {
        kind: 'timer',
        currentSeconds: relevant.reduce(
          (total, event) => total + (event.kind === 'time-added' ? event.seconds : 0),
          0,
        ),
        targetSeconds: policy.targetSeconds,
        incrementsSeconds: policy.incrementsSeconds,
      };
  }
}

export interface CompleteChallengeInput {
  assignment: DailyAssignment;
  events: ProgressEvent[];
  completionId: string;
  wallEntryId: string;
  completedAt: string;
  reflection?: string;
}

export interface CompleteChallengeResult {
  assignment: DailyAssignment;
  completion: Completion;
  wallEntry: GoodnessEntry;
}

export function completeChallenge(input: CompleteChallengeInput): CompleteChallengeResult {
  const { assignment } = input;
  if (assignment.status !== 'accepted') {
    throw new DomainError(
      'assignment-not-accepted',
      'Only an accepted challenge can be completed.',
    );
  }

  const progress = progressFor(assignment, input.events);
  const completionData = completionDataFor(assignment.challenge, progress);
  if (!completionData.ready) {
    throw new DomainError(
      'target-not-reached',
      'The visible challenge target has not been reached yet.',
    );
  }

  const completedAssignment: DailyAssignment = {
    ...assignment,
    status: 'completed',
    completedAt: input.completedAt,
  };
  const completion: Completion = {
    id: input.completionId,
    assignmentId: assignment.id,
    userId: assignment.userId,
    completedAt: input.completedAt,
    localDate: assignment.localDate,
    progressValue: completionData.value,
    result: completionData.result,
  };
  const wallEntry: GoodnessEntry = {
    id: input.wallEntryId,
    completionId: completion.id,
    userId: assignment.userId,
    localDate: assignment.localDate,
    completedAt: input.completedAt,
    category: assignment.challenge.category,
    practicedQualities: assignment.challenge.practicedQualities,
    challengeTitle: assignment.challenge.title,
    challengeInstructions: assignment.challenge.instructions,
    result: completion.result,
    ...(input.reflection ? { reflection: input.reflection } : {}),
  };

  return { assignment: completedAssignment, completion, wallEntry };
}

export function progressIsComplete(progress: ProgressState): boolean {
  switch (progress.kind) {
    case 'counter':
      return progress.current >= progress.target;
    case 'confirmation':
      return progress.confirmed;
    case 'checklist':
      return progress.completedItemIds.length >= progress.items.length;
    case 'timer':
      return progress.currentSeconds >= progress.targetSeconds;
  }
}

export function advanceStreak(streak: StreakState, localDate: string): StreakState {
  if (streak.lastCompletedLocalDate === localDate) {
    return {
      ...streak,
      lifetimeCompletions: streak.lifetimeCompletions + 1,
    };
  }

  const isConsecutive =
    streak.lastCompletedLocalDate !== undefined &&
    addDays(streak.lastCompletedLocalDate, 1) === localDate;
  const current = isConsecutive ? streak.current + 1 : 1;

  return {
    current,
    longest: Math.max(streak.longest, current),
    lifetimeCompletions: streak.lifetimeCompletions + 1,
    lastCompletedLocalDate: localDate,
  };
}

function completionDataFor(
  challenge: ChallengeDefinition,
  progress: ProgressState,
): { ready: boolean; value: number; result: string } {
  if (challenge.tracking.kind !== progress.kind) {
    throw new DomainError(
      'tracking-policy-mismatch',
      'Challenge progress could not be interpreted.',
    );
  }
  switch (progress.kind) {
    case 'counter':
      return {
        ready: progress.current >= progress.target,
        value: progress.current,
        result: progress.current + ' ' + progress.unit,
      };
    case 'confirmation':
      return {
        ready: progress.confirmed,
        value: progress.confirmed ? 1 : 0,
        result:
          challenge.tracking.kind === 'confirmation'
            ? challenge.tracking.resultLabel
            : 'Action completed',
      };
    case 'checklist':
      return {
        ready: progress.completedItemIds.length >= progress.items.length,
        value: progress.completedItemIds.length,
        result: progress.completedItemIds.length + ' deliberate steps completed',
      };
    case 'timer':
      return {
        ready: progress.currentSeconds >= progress.targetSeconds,
        value: progress.currentSeconds,
        result: Math.floor(progress.currentSeconds / 60) + ' minutes practiced',
      };
  }
}

function assertPositiveInteger(value: number, code: string, message: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new DomainError(code, message);
  }
}

function addDays(localDate: string, amount: number): string {
  const parsed = new Date(localDate + 'T00:00:00.000Z');
  if (Number.isNaN(parsed.getTime())) {
    throw new DomainError('invalid-local-date', 'The completion date is invalid.');
  }
  parsed.setUTCDate(parsed.getUTCDate() + amount);
  return parsed.toISOString().slice(0, 10);
}
