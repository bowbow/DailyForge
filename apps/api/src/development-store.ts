import {
  acceptAssignment,
  advanceStreak,
  completeChallenge,
  DomainError,
  progressFor,
  recordProgressEvent,
  replaceAssignment,
  type ChallengeCategory,
  type ChallengeDefinition,
  type Completion,
  type DailyAssignment,
  type GoodnessEntry,
  type ProgressEvent,
  type StreakState,
} from '@daily-forge/domain';
import {
  type CompleteChallengeCommand,
  type HistoryResponse,
  type ProgressEventCommand,
  type TodayResponse,
  type WallResponse,
} from '@daily-forge/contracts';

type Clock = () => Date;

const timeZone = 'America/Los_Angeles';

export const developmentCatalog: ChallengeDefinition[] = [
  {
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
      increments: [1, 5],
    },
  },
  {
    id: 'prudence-pause',
    version: 1,
    category: 'character',
    title: 'Practice one deliberate pause',
    instructions:
      'Before one non-trivial choice today, work through the three prompts and then choose deliberately.',
    practicedQualities: ['prudence', 'temperance'],
    expectedMinutes: 5,
    tracking: {
      kind: 'checklist',
      items: [
        { id: 'name-choice', label: 'Name the choice without rushing it' },
        { id: 'consider-effects', label: 'Consider who or what the choice may affect' },
        { id: 'choose-deliberately', label: 'Choose and briefly note your reason' },
      ],
    },
  },
  {
    id: 'useful-help',
    version: 1,
    category: 'community',
    title: 'Offer one concrete act of help',
    instructions:
      'Notice a person who may benefit from help, ask rather than assume, and follow their answer without pressure.',
    practicedQualities: ['kindness', 'attentiveness'],
    expectedMinutes: 10,
    safetyNote: 'Respect boundaries and choose an action that is safe for everyone involved.',
    tracking: {
      kind: 'confirmation',
      actionLabel: 'I offered or gave useful help',
      resultLabel: 'One consent-aware act of help',
    },
  },
  {
    id: 'constraint-sketch',
    version: 1,
    category: 'creativity',
    title: 'Make a ten-minute constraint sketch',
    instructions:
      'Choose one brush and two colors. Explore an idea for ten minutes without judging or polishing the result.',
    practicedQualities: ['curiosity', 'creative courage'],
    expectedMinutes: 10,
    tracking: {
      kind: 'timer',
      targetSeconds: 600,
      incrementsSeconds: [300, 600],
    },
  },
];

export class DevelopmentStore {
  private assignment: DailyAssignment;
  private progressEvents: ProgressEvent[] = [];
  private completion: Completion | undefined;
  private wallEntries: GoodnessEntry[] = [];
  private replacedAssignments: DailyAssignment[] = [];
  private replacementCount = 0;
  private streak: StreakState = {
    current: 0,
    longest: 0,
    lifetimeCompletions: 0,
  };

  constructor(private readonly clock: Clock = () => new Date()) {
    this.assignment = this.seedAssignment(developmentCatalog[0]!, 'development-assignment-today');
  }

  getToday(): TodayResponse {
    return {
      development: true,
      assignment: structuredClone(this.assignment),
      progress: structuredClone(progressFor(this.assignment, this.progressEvents)),
      replacementCount: this.replacementCount,
      streak: structuredClone(this.streak),
    };
  }

  accept(): TodayResponse {
    this.assignment = acceptAssignment(this.assignment, this.clock().toISOString());
    return this.getToday();
  }

  replace(): TodayResponse {
    const currentIndex = developmentCatalog.findIndex(
      (challenge) => challenge.id === this.assignment.challenge.id,
    );
    const nextIndex = (currentIndex + 1) % developmentCatalog.length;
    const nextChallenge = developmentCatalog[nextIndex];
    if (!nextChallenge) {
      throw new DomainError('catalog-empty', 'No replacement challenge is available.');
    }
    const nextCount = this.replacementCount + 1;
    const result = replaceAssignment({
      assignment: this.assignment,
      nextAssignmentId: 'development-assignment-replacement-' + nextCount,
      nextChallenge,
      proposedAt: this.clock().toISOString(),
    });
    this.replacedAssignments = [...this.replacedAssignments, result.replaced];
    this.assignment = result.next;
    this.replacementCount = nextCount;
    this.progressEvents = [];
    return this.getToday();
  }

  recordProgress(assignmentId: string, command: ProgressEventCommand): TodayResponse {
    this.assertAssignment(assignmentId);
    this.progressEvents = recordProgressEvent(
      this.assignment,
      this.progressEvents,
      toProgressEvent(assignmentId, command),
    );
    return this.getToday();
  }

  complete(assignmentId: string, command: CompleteChallengeCommand): TodayResponse {
    this.assertAssignment(assignmentId);
    if (this.completion) {
      return this.getToday();
    }

    const result = completeChallenge({
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

  getWall(category?: ChallengeCategory): WallResponse {
    const entries = category
      ? this.wallEntries.filter((entry) => entry.category === category)
      : this.wallEntries;
    return { entries: structuredClone(entries) };
  }

  getHistory(): HistoryResponse {
    return {
      streak: structuredClone(this.streak),
      completedLocalDates: this.wallEntries.map((entry) => entry.localDate),
      completionsByCategory: {
        body: this.countCategory('body'),
        character: this.countCategory('character'),
        community: this.countCategory('community'),
        creativity: this.countCategory('creativity'),
      },
    };
  }

  reset(): TodayResponse {
    this.assignment = this.seedAssignment(developmentCatalog[0]!, 'development-assignment-today');
    this.progressEvents = [];
    this.completion = undefined;
    this.wallEntries = [];
    this.replacedAssignments = [];
    this.replacementCount = 0;
    this.streak = { current: 0, longest: 0, lifetimeCompletions: 0 };
    return this.getToday();
  }

  private assertAssignment(assignmentId: string): void {
    if (assignmentId !== this.assignment.id) {
      throw new DomainError('assignment-not-found', 'The requested challenge was not found.');
    }
  }

  private countCategory(category: ChallengeCategory): number {
    return this.wallEntries.filter((entry) => entry.category === category).length;
  }

  private seedAssignment(challenge: ChallengeDefinition, id: string): DailyAssignment {
    const now = this.clock();
    return {
      id,
      userId: 'development-user',
      localDate: localDateFor(now, timeZone),
      timeZone,
      status: 'proposed',
      proposedAt: now.toISOString(),
      challenge,
    };
  }
}

function toProgressEvent(assignmentId: string, command: ProgressEventCommand): ProgressEvent {
  const base = {
    id: command.eventId,
    assignmentId,
    occurredAt: command.occurredAt,
  };
  switch (command.kind) {
    case 'count-added':
      return { ...base, kind: command.kind, amount: command.amount };
    case 'confirmation-recorded':
      return { ...base, kind: command.kind };
    case 'checklist-item-completed':
      return { ...base, kind: command.kind, itemId: command.itemId };
    case 'time-added':
      return { ...base, kind: command.kind, seconds: command.seconds };
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
