import {
  acceptAssignment,
  addCountEvent,
  advanceStreak,
  completeCounterChallenge,
  countProgress,
  DomainError,
  type Completion,
  type CountAddedEvent,
  type DailyAssignment,
  type GoodnessEntry,
  type StreakState,
} from '@daily-forge/domain';
import {
  type CompleteChallengeCommand,
  type CountProgressCommand,
  type HistoryResponse,
  type TodayResponse,
  type WallResponse,
} from '@daily-forge/contracts';

type Clock = () => Date;

const timeZone = 'America/Los_Angeles';

export class DevelopmentStore {
  private assignment: DailyAssignment;
  private progressEvents: CountAddedEvent[] = [];
  private completion: Completion | undefined;
  private wallEntries: GoodnessEntry[] = [];
  private streak: StreakState = {
    current: 0,
    longest: 0,
    lifetimeCompletions: 0,
  };

  constructor(private readonly clock: Clock = () => new Date()) {
    this.assignment = this.seedAssignment();
  }

  getToday(): TodayResponse {
    return {
      development: true,
      assignment: structuredClone(this.assignment),
      progress: {
        current: countProgress(this.assignment.id, this.progressEvents),
        target: this.assignment.challenge.tracking.target,
      },
      streak: structuredClone(this.streak),
    };
  }

  accept(): TodayResponse {
    this.assignment = acceptAssignment(this.assignment, this.clock().toISOString());
    return this.getToday();
  }

  recordProgress(assignmentId: string, command: CountProgressCommand): TodayResponse {
    this.assertAssignment(assignmentId);
    this.progressEvents = addCountEvent(this.assignment, this.progressEvents, {
      id: command.eventId,
      assignmentId,
      kind: 'count-added',
      amount: command.amount,
      occurredAt: command.occurredAt,
    });
    return this.getToday();
  }

  complete(assignmentId: string, command: CompleteChallengeCommand): TodayResponse {
    this.assertAssignment(assignmentId);
    if (this.completion) {
      return this.getToday();
    }

    const result = completeCounterChallenge({
      assignment: this.assignment,
      events: this.progressEvents,
      completionId: command.completionId,
      wallEntryId: command.wallEntryId,
      completedAt: command.completedAt,
      ...(command.reflection ? { reflection: command.reflection } : {}),
    });
    this.assignment = result.assignment;
    this.completion = result.completion;
    this.wallEntries = [result.wallEntry, ...this.wallEntries];
    this.streak = advanceStreak(this.streak, result.completion.localDate);
    return this.getToday();
  }

  getWall(): WallResponse {
    return {
      entries: structuredClone(this.wallEntries),
    };
  }

  getHistory(): HistoryResponse {
    return {
      streak: structuredClone(this.streak),
      completedLocalDates: this.wallEntries.map((entry) => entry.localDate),
    };
  }

  reset(): TodayResponse {
    this.assignment = this.seedAssignment();
    this.progressEvents = [];
    this.completion = undefined;
    this.wallEntries = [];
    this.streak = {
      current: 0,
      longest: 0,
      lifetimeCompletions: 0,
    };
    return this.getToday();
  }

  private assertAssignment(assignmentId: string): void {
    if (assignmentId !== this.assignment.id) {
      throw new DomainError('assignment-not-found', 'The requested challenge was not found.');
    }
  }

  private seedAssignment(): DailyAssignment {
    const now = this.clock();
    return {
      id: 'development-assignment-today',
      userId: 'development-user',
      localDate: localDateFor(now, timeZone),
      timeZone,
      status: 'proposed',
      proposedAt: now.toISOString(),
      challenge: {
        id: 'push-ups-20',
        version: 1,
        category: 'body',
        title: 'Accumulate 20 push-ups today',
        instructions:
          'Use any safe variation that suits you. Break the total into as many small sets as you like.',
        practicedQualities: ['consistency'],
        expectedMinutes: 3,
        safetyNote: 'Choose a comfortable variation and stop if you feel pain.',
        tracking: {
          kind: 'counter',
          target: 20,
          unit: 'push-ups',
        },
      },
    };
  }
}

function localDateFor(date: Date, zone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return values.year + '-' + values.month + '-' + values.day;
}
