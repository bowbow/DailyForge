import {
  type Completion,
  type CountAddedEvent,
  type DailyAssignment,
  type GoodnessEntry,
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
  return {
    ...assignment,
    status: 'accepted',
    acceptedAt,
  };
}

export function addCountEvent(
  assignment: DailyAssignment,
  existingEvents: CountAddedEvent[],
  event: CountAddedEvent,
): CountAddedEvent[] {
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
  if (!Number.isSafeInteger(event.amount) || event.amount <= 0) {
    throw new DomainError('invalid-count', 'Progress must be a positive whole number.');
  }
  return [...existingEvents, event];
}

export function countProgress(assignmentId: string, events: CountAddedEvent[]): number {
  return events
    .filter((event) => event.assignmentId === assignmentId)
    .reduce((total, event) => total + event.amount, 0);
}

export interface CompleteCounterInput {
  assignment: DailyAssignment;
  events: CountAddedEvent[];
  completionId: string;
  wallEntryId: string;
  completedAt: string;
  reflection?: string;
}

export interface CompleteCounterResult {
  assignment: DailyAssignment;
  completion: Completion;
  wallEntry: GoodnessEntry;
}

export function completeCounterChallenge(input: CompleteCounterInput): CompleteCounterResult {
  const { assignment } = input;
  if (assignment.status !== 'accepted') {
    throw new DomainError(
      'assignment-not-accepted',
      'Only an accepted challenge can be completed.',
    );
  }

  const total = countProgress(assignment.id, input.events);
  if (total < assignment.challenge.tracking.target) {
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
    total,
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
    result: total + ' ' + assignment.challenge.tracking.unit,
    ...(input.reflection ? { reflection: input.reflection } : {}),
  };

  return {
    assignment: completedAssignment,
    completion,
    wallEntry,
  };
}

export function advanceStreak(streak: StreakState, localDate: string): StreakState {
  if (streak.lastCompletedLocalDate === localDate) {
    return streak;
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

function addDays(localDate: string, amount: number): string {
  const parsed = new Date(localDate + 'T00:00:00.000Z');
  if (Number.isNaN(parsed.getTime())) {
    throw new DomainError('invalid-local-date', 'The completion date is invalid.');
  }
  parsed.setUTCDate(parsed.getUTCDate() + amount);
  return parsed.toISOString().slice(0, 10);
}
