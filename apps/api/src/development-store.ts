import {
  acceptAssignment,
  advanceStreak,
  challengeCategories,
  completeChallenge,
  DomainError,
  progressFor,
  recordProgressEvent,
  replaceAssignment,
  skipAssignment,
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
    tracking: { kind: 'counter', target: 20, unit: 'push-ups', increments: [1, 5] },
  },
  {
    id: 'mobility-reset-5',
    version: 1,
    category: 'body',
    title: 'Take a five-minute mobility reset',
    instructions:
      'Move gently through comfortable ankle, hip, and upper-back ranges. This supports mobility without adding aerobic training.',
    practicedQualities: ['mobility', 'body awareness'],
    expectedMinutes: 5,
    safetyNote: 'Use pain-free ranges and avoid forcing a stretch.',
    tracking: { kind: 'timer', targetSeconds: 300, incrementsSeconds: [60, 300] },
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
    id: 'temperance-pause',
    version: 1,
    category: 'character',
    title: 'Delay one nonessential impulse',
    instructions:
      'Notice one nonessential impulse, wait ten minutes, and then decide deliberately whether it still serves you.',
    practicedQualities: ['temperance', 'self-command'],
    expectedMinutes: 10,
    tracking: {
      kind: 'checklist',
      items: [
        { id: 'notice', label: 'Name the impulse without judging it' },
        { id: 'wait', label: 'Wait ten minutes' },
        { id: 'decide', label: 'Make a deliberate choice' },
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
    id: 'thoughtful-check-in',
    version: 1,
    category: 'community',
    title: 'Make one thoughtful check-in',
    instructions:
      'Contact someone you already know, ask how they are, and make room for their answer without pressing for private details.',
    practicedQualities: ['care', 'attentiveness'],
    expectedMinutes: 10,
    safetyNote: 'Respect their time, privacy, and choice not to engage.',
    tracking: {
      kind: 'confirmation',
      actionLabel: 'I made a respectful check-in',
      resultLabel: 'One thoughtful check-in',
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
    tracking: { kind: 'timer', targetSeconds: 600, incrementsSeconds: [300, 600] },
  },
  {
    id: 'three-color-palette',
    version: 1,
    category: 'creativity',
    title: 'Build a three-color digital palette',
    instructions:
      'Choose a visual reference, identify three dominant colors, and save a small palette to use in future artwork.',
    practicedQualities: ['observation', 'experimentation'],
    expectedMinutes: 8,
    tracking: {
      kind: 'checklist',
      items: [
        { id: 'choose-reference', label: 'Choose a visual reference' },
        { id: 'sample-colors', label: 'Select three useful colors' },
        { id: 'save-palette', label: 'Save and name the palette' },
      ],
    },
  },
];

interface HistoricalSeed {
  daysAgo: number;
  category: ChallengeCategory;
  title: string;
  instructions: string;
  result: string;
  practicedQualities: string[];
  reflection?: string;
}

const developmentHistory: HistoricalSeed[] = [
  {
    daysAgo: 1,
    category: 'creativity',
    title: 'Explore one textured brush',
    instructions: 'Use one unfamiliar textured brush in a short digital study.',
    result: '12-minute brush study',
    practicedQualities: ['curiosity', 'experimentation'],
    reflection: 'The rough edge made the shadows feel less mechanical.',
  },
  {
    daysAgo: 1,
    category: 'body',
    title: 'Complete 24 controlled calf raises',
    instructions: 'Use a stable support and move through a comfortable range.',
    result: '24 calf raises',
    practicedQualities: ['consistency', 'lower-leg strength'],
    reflection: 'Three small sets worked well between other tasks.',
  },
  {
    daysAgo: 2,
    category: 'community',
    title: 'Make one thoughtful check-in',
    instructions: 'Contact someone you know and make room for their answer.',
    result: 'One thoughtful check-in',
    practicedQualities: ['care', 'attentiveness'],
    reflection: 'I listened without trying to solve anything.',
  },
  {
    daysAgo: 4,
    category: 'character',
    title: 'Let someone finish speaking',
    instructions: 'Listen through the end of one conversation before forming a response.',
    result: 'One deliberate listening practice',
    practicedQualities: ['patience', 'attentiveness'],
    reflection: 'The pause helped me notice what I would otherwise have missed.',
  },
  {
    daysAgo: 4,
    category: 'creativity',
    title: 'Make a three-value study',
    instructions: 'Reduce a reference to light, middle, and dark values.',
    result: 'One three-value digital study',
    practicedQualities: ['observation', 'restraint'],
  },
  {
    daysAgo: 5,
    category: 'body',
    title: 'Take a five-minute mobility reset',
    instructions: 'Move gently through comfortable ankle, hip, and upper-back ranges.',
    result: '5 minutes of mobility',
    practicedQualities: ['mobility', 'body awareness'],
    reflection: 'My ankles felt freer afterward; the easy range was enough.',
  },
  {
    daysAgo: 5,
    category: 'community',
    title: 'Improve one shared space',
    instructions: 'Leave a shared place a little better through one modest action.',
    result: 'Tidied a shared area',
    practicedQualities: ['stewardship', 'initiative'],
  },
  {
    daysAgo: 6,
    category: 'character',
    title: 'Delay one nonessential impulse',
    instructions: 'Wait ten minutes, then choose deliberately.',
    result: 'One deliberate ten-minute pause',
    practicedQualities: ['temperance', 'self-command'],
    reflection: 'After ten minutes I decided I did not need it.',
  },
  {
    daysAgo: 6,
    category: 'body',
    title: 'Practice supported balance',
    instructions: 'Practice a brief balance exercise near stable support.',
    result: '3 minutes of supported balance',
    practicedQualities: ['balance', 'body awareness'],
  },
  {
    daysAgo: 8,
    category: 'creativity',
    title: 'Build a three-color digital palette',
    instructions: 'Choose three dominant colors from a visual reference and save them.',
    result: 'One saved three-color palette',
    practicedQualities: ['observation', 'experimentation'],
    reflection: 'The muted green is worth reusing in a larger piece.',
  },
  {
    daysAgo: 9,
    category: 'community',
    title: 'Offer practical directions',
    instructions: 'Offer useful directions when appropriate and respect the answer.',
    result: 'One consent-aware offer of help',
    practicedQualities: ['kindness', 'attentiveness'],
  },
  {
    daysAgo: 9,
    category: 'body',
    title: 'Complete 15 controlled sit-to-stands',
    instructions: 'Use a stable chair and a comfortable, controlled pace.',
    result: '15 sit-to-stands',
    practicedQualities: ['useful strength', 'control'],
  },
  {
    daysAgo: 11,
    category: 'character',
    title: 'Ask for feedback and listen',
    instructions: 'Invite one useful observation without immediately defending yourself.',
    result: 'One feedback conversation',
    practicedQualities: ['humility', 'courage'],
    reflection: 'Writing the suggestion down made it easier to hear calmly.',
  },
  {
    daysAgo: 11,
    category: 'creativity',
    title: 'Try one unfamiliar layer mode',
    instructions: 'Experiment with one unfamiliar layer mode in a disposable study.',
    result: 'One layer-mode experiment',
    practicedQualities: ['curiosity', 'creative courage'],
  },
];

export class DevelopmentStore {
  private assignments: Record<ChallengeCategory, DailyAssignment>;
  private progressEvents: ProgressEvent[] = [];
  private completions: Completion[] = [];
  private wallEntries: GoodnessEntry[] = [];
  private replacedAssignments: DailyAssignment[] = [];
  private replacementCounts: Record<ChallengeCategory, number> = emptyCategoryCounts();
  private streak: StreakState = { current: 0, longest: 0, lifetimeCompletions: 0 };

  constructor(
    private readonly clock: Clock = () => new Date(),
    private readonly includeDemoHistory = true,
  ) {
    this.assignments = this.seedAssignments();
    this.restoreDemoHistory();
  }

  getToday(): TodayResponse {
    return {
      development: true,
      challenges: challengeCategories.map((category) => {
        const assignment = this.assignments[category];
        return {
          assignment: structuredClone(assignment),
          progress: structuredClone(progressFor(assignment, this.progressEvents)),
          replacementCount: this.replacementCounts[category],
        };
      }),
      streak: structuredClone(this.streak),
    };
  }

  accept(assignmentId: string): TodayResponse {
    const { assignment, category } = this.findAssignment(assignmentId);
    this.assignments[category] = acceptAssignment(assignment, this.clock().toISOString());
    return this.getToday();
  }

  replace(assignmentId: string): TodayResponse {
    const { assignment, category } = this.findAssignment(assignmentId);
    const categoryCatalog = developmentCatalog.filter(
      (challenge) => challenge.category === category,
    );
    const currentIndex = categoryCatalog.findIndex(
      (challenge) => challenge.id === assignment.challenge.id,
    );
    const nextChallenge = categoryCatalog[(currentIndex + 1) % categoryCatalog.length];
    if (!nextChallenge) {
      throw new DomainError('catalog-empty', 'No replacement challenge is available.');
    }
    const nextCount = this.replacementCounts[category] + 1;
    const result = replaceAssignment({
      assignment,
      nextAssignmentId: `development-assignment-${category}-replacement-${nextCount}`,
      nextChallenge,
      proposedAt: this.clock().toISOString(),
    });
    this.replacedAssignments = [...this.replacedAssignments, result.replaced];
    this.assignments[category] = result.next;
    this.replacementCounts[category] = nextCount;
    return this.getToday();
  }

  skip(assignmentId: string): TodayResponse {
    const { assignment, category } = this.findAssignment(assignmentId);
    this.assignments[category] = skipAssignment(assignment, this.clock().toISOString());
    return this.getToday();
  }

  recordProgress(assignmentId: string, command: ProgressEventCommand): TodayResponse {
    const { assignment } = this.findAssignment(assignmentId);
    this.progressEvents = recordProgressEvent(
      assignment,
      this.progressEvents,
      toProgressEvent(assignmentId, command),
    );
    return this.getToday();
  }

  complete(assignmentId: string, command: CompleteChallengeCommand): TodayResponse {
    const { assignment, category } = this.findAssignment(assignmentId);
    if (this.completions.some((completion) => completion.assignmentId === assignmentId)) {
      return this.getToday();
    }

    const result = completeChallenge({
      assignment,
      events: this.progressEvents,
      completionId: command.completionId,
      wallEntryId: command.wallEntryId,
      completedAt: command.completedAt,
      ...(command.reflection ? { reflection: command.reflection } : {}),
    });
    this.assignments[category] = result.assignment;
    this.completions = [...this.completions, result.completion];
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
      completedLocalDates: [...new Set(this.wallEntries.map((entry) => entry.localDate))],
      completionsByCategory: {
        body: this.countCategory('body'),
        character: this.countCategory('character'),
        community: this.countCategory('community'),
        creativity: this.countCategory('creativity'),
      },
    };
  }

  reset(): TodayResponse {
    this.assignments = this.seedAssignments();
    this.progressEvents = [];
    this.completions = [];
    this.wallEntries = [];
    this.replacedAssignments = [];
    this.replacementCounts = emptyCategoryCounts();
    this.streak = { current: 0, longest: 0, lifetimeCompletions: 0 };
    this.restoreDemoHistory();
    return this.getToday();
  }

  private restoreDemoHistory(): void {
    if (!this.includeDemoHistory) return;
    this.wallEntries = seedWallEntries(this.clock());
    this.streak = [...this.wallEntries]
      .sort((left, right) => left.completedAt.localeCompare(right.completedAt))
      .reduce<StreakState>((streak, entry) => advanceStreak(streak, entry.localDate), {
        current: 0,
        longest: 0,
        lifetimeCompletions: 0,
      });
  }

  private findAssignment(assignmentId: string): {
    assignment: DailyAssignment;
    category: ChallengeCategory;
  } {
    for (const category of challengeCategories) {
      const assignment = this.assignments[category];
      if (assignment.id === assignmentId) return { assignment, category };
    }
    throw new DomainError('assignment-not-found', 'The requested challenge was not found.');
  }

  private countCategory(category: ChallengeCategory): number {
    return this.wallEntries.filter((entry) => entry.category === category).length;
  }

  private seedAssignments(): Record<ChallengeCategory, DailyAssignment> {
    return Object.fromEntries(
      challengeCategories.map((category) => {
        const challenge = developmentCatalog.find((candidate) => candidate.category === category);
        if (!challenge) throw new DomainError('catalog-empty', `No ${category} challenge exists.`);
        return [category, this.seedAssignment(challenge, `development-assignment-${category}`)];
      }),
    ) as Record<ChallengeCategory, DailyAssignment>;
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

function emptyCategoryCounts(): Record<ChallengeCategory, number> {
  return { body: 0, character: 0, community: 0, creativity: 0 };
}

function seedWallEntries(now: Date): GoodnessEntry[] {
  return developmentHistory
    .map((seed, index) => {
      const completedAt = new Date(
        now.getTime() - seed.daysAgo * 24 * 60 * 60 * 1000 - index * 60 * 1000,
      );
      return {
        id: `development-wall-history-${index + 1}`,
        completionId: `development-completion-history-${index + 1}`,
        userId: 'development-user',
        localDate: localDateFor(completedAt, timeZone),
        completedAt: completedAt.toISOString(),
        category: seed.category,
        practicedQualities: seed.practicedQualities,
        challengeTitle: seed.title,
        challengeInstructions: seed.instructions,
        result: seed.result,
        ...(seed.reflection ? { reflection: seed.reflection } : {}),
      } satisfies GoodnessEntry;
    })
    .sort((left, right) => right.completedAt.localeCompare(left.completedAt));
}

function toProgressEvent(assignmentId: string, command: ProgressEventCommand): ProgressEvent {
  const base = { id: command.eventId, assignmentId, occurredAt: command.occurredAt };
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
