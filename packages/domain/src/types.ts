export const challengeCategories = ['body', 'character', 'community', 'creativity'] as const;

export type ChallengeCategory = (typeof challengeCategories)[number];

export type AssignmentStatus = 'proposed' | 'accepted' | 'completed' | 'replaced' | 'skipped';

export interface CounterPolicy {
  kind: 'counter';
  target: number;
  unit: string;
}

export interface ChallengeDefinition {
  id: string;
  version: number;
  category: ChallengeCategory;
  title: string;
  instructions: string;
  practicedQualities: string[];
  expectedMinutes: number;
  safetyNote?: string;
  tracking: CounterPolicy;
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
}

export interface CountAddedEvent {
  id: string;
  assignmentId: string;
  kind: 'count-added';
  amount: number;
  occurredAt: string;
}

export interface Completion {
  id: string;
  assignmentId: string;
  userId: string;
  completedAt: string;
  localDate: string;
  total: number;
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
