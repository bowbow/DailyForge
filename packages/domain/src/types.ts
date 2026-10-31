export const challengeCategories = ['body', 'character', 'community', 'creativity'] as const;

export type ChallengeCategory = (typeof challengeCategories)[number];

export type AssignmentStatus = 'proposed' | 'accepted' | 'completed' | 'replaced' | 'skipped';

export interface CounterPolicy {
  kind: 'counter';
  target: number;
  unit: string;
  increments: number[];
}

export interface ConfirmationPolicy {
  kind: 'confirmation';
  actionLabel: string;
  resultLabel: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
}

export interface ChecklistPolicy {
  kind: 'checklist';
  items: ChecklistItem[];
}

export interface TimerPolicy {
  kind: 'timer';
  targetSeconds: number;
  incrementsSeconds: number[];
}

export type TrackingPolicy = CounterPolicy | ConfirmationPolicy | ChecklistPolicy | TimerPolicy;

export interface ChallengeDefinition {
  id: string;
  version: number;
  category: ChallengeCategory;
  title: string;
  instructions: string;
  practicedQualities: string[];
  expectedMinutes: number;
  safetyNote?: string;
  tracking: TrackingPolicy;
}

export interface DailyAssignment {
  id: string;
  userId: string;
  localDate: string;
  timeZone: string;
  status: AssignmentStatus;
  challenge: ChallengeDefinition;
  proposedAt: string;
  acceptedAt?: string;
  completedAt?: string;
  skippedAt?: string;
}

interface ProgressEventBase {
  id: string;
  assignmentId: string;
  occurredAt: string;
}

export interface CountAddedEvent extends ProgressEventBase {
  kind: 'count-added';
  amount: number;
}

export interface ConfirmationRecordedEvent extends ProgressEventBase {
  kind: 'confirmation-recorded';
}

export interface ChecklistItemCompletedEvent extends ProgressEventBase {
  kind: 'checklist-item-completed';
  itemId: string;
}

export interface TimeAddedEvent extends ProgressEventBase {
  kind: 'time-added';
  seconds: number;
}

export type ProgressEvent =
  CountAddedEvent | ConfirmationRecordedEvent | ChecklistItemCompletedEvent | TimeAddedEvent;

export type ProgressState =
  | { kind: 'counter'; current: number; target: number; unit: string; increments: number[] }
  | { kind: 'confirmation'; confirmed: boolean; actionLabel: string }
  | {
      kind: 'checklist';
      completedItemIds: string[];
      items: ChecklistItem[];
    }
  | {
      kind: 'timer';
      currentSeconds: number;
      targetSeconds: number;
      incrementsSeconds: number[];
    };

export interface Completion {
  id: string;
  assignmentId: string;
  userId: string;
  completedAt: string;
  localDate: string;
  progressValue: number;
  result: string;
}

export interface GoodnessEntry {
  id: string;
  completionId: string;
  userId: string;
  localDate: string;
  completedAt: string;
  category: ChallengeCategory;
  practicedQualities: string[];
  challengeTitle: string;
  challengeInstructions: string;
  result: string;
  reflection?: string;
}

export interface StreakState {
  current: number;
  longest: number;
  lifetimeCompletions: number;
  lastCompletedLocalDate?: string;
}
