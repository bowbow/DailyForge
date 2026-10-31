import { z } from 'zod';

export const healthResponseSchema = z.object({
  service: z.literal('daily-forge-api'),
  status: z.literal('ok'),
  timestamp: z.iso.datetime(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const challengeCategorySchema = z.enum(['body', 'character', 'community', 'creativity']);

export const counterPolicySchema = z.object({
  kind: z.literal('counter'),
  target: z.number().int().positive(),
  unit: z.string().min(1),
});

export const challengeDefinitionSchema = z.object({
  id: z.string().min(1),
  version: z.number().int().positive(),
  category: challengeCategorySchema,
  title: z.string().min(1),
  instructions: z.string().min(1),
  practicedQualities: z.array(z.string().min(1)),
  expectedMinutes: z.number().int().positive(),
  safetyNote: z.string().min(1).optional(),
  tracking: counterPolicySchema,
});

export const assignmentStatusSchema = z.enum([
  'proposed',
  'accepted',
  'completed',
  'replaced',
  'skipped',
]);

export const dailyAssignmentSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  localDate: z.iso.date(),
  timeZone: z.string().min(1),
  status: assignmentStatusSchema,
  challenge: challengeDefinitionSchema,
  proposedAt: z.iso.datetime(),
  acceptedAt: z.iso.datetime().optional(),
  completedAt: z.iso.datetime().optional(),
});

export const streakStateSchema = z.object({
  current: z.number().int().nonnegative(),
  longest: z.number().int().nonnegative(),
  lifetimeCompletions: z.number().int().nonnegative(),
  lastCompletedLocalDate: z.iso.date().optional(),
});

export const todayResponseSchema = z.object({
  development: z.literal(true),
  assignment: dailyAssignmentSchema,
  progress: z.object({
    current: z.number().int().nonnegative(),
    target: z.number().int().positive(),
  }),
  streak: streakStateSchema,
});

export const countProgressCommandSchema = z.object({
  eventId: z.uuid(),
  amount: z.number().int().positive(),
  occurredAt: z.iso.datetime(),
});

export const completeChallengeCommandSchema = z.object({
  completionId: z.uuid(),
  wallEntryId: z.uuid(),
  completedAt: z.iso.datetime(),
  reflection: z.string().trim().max(1000).optional(),
});

export const goodnessEntrySchema = z.object({
  id: z.string().min(1),
  completionId: z.string().min(1),
  userId: z.string().min(1),
  localDate: z.iso.date(),
  completedAt: z.iso.datetime(),
  category: challengeCategorySchema,
  practicedQualities: z.array(z.string().min(1)),
  challengeTitle: z.string().min(1),
  challengeInstructions: z.string().min(1),
  result: z.string().min(1),
  reflection: z.string().optional(),
});

export const wallResponseSchema = z.object({
  entries: z.array(goodnessEntrySchema),
});

export const historyResponseSchema = z.object({
  streak: streakStateSchema,
  completedLocalDates: z.array(z.iso.date()),
});

export const errorResponseSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
});

export type TodayResponse = z.infer<typeof todayResponseSchema>;
export type CountProgressCommand = z.infer<typeof countProgressCommandSchema>;
export type CompleteChallengeCommand = z.infer<typeof completeChallengeCommandSchema>;
export type GoodnessEntryResponse = z.infer<typeof goodnessEntrySchema>;
export type WallResponse = z.infer<typeof wallResponseSchema>;
export type HistoryResponse = z.infer<typeof historyResponseSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
