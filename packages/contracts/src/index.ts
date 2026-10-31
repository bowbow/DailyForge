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
  increments: z.array(z.number().int().positive()).min(1),
});

export const confirmationPolicySchema = z.object({
  kind: z.literal('confirmation'),
  actionLabel: z.string().min(1),
  resultLabel: z.string().min(1),
});

export const checklistItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
});

export const checklistPolicySchema = z.object({
  kind: z.literal('checklist'),
  items: z.array(checklistItemSchema).min(1),
});

export const timerPolicySchema = z.object({
  kind: z.literal('timer'),
  targetSeconds: z.number().int().positive(),
  incrementsSeconds: z.array(z.number().int().positive()).min(1),
});

export const trackingPolicySchema = z.discriminatedUnion('kind', [
  counterPolicySchema,
  confirmationPolicySchema,
  checklistPolicySchema,
  timerPolicySchema,
]);

export const challengeDefinitionSchema = z.object({
  id: z.string().min(1),
  version: z.number().int().positive(),
  category: challengeCategorySchema,
  title: z.string().min(1),
  instructions: z.string().min(1),
  practicedQualities: z.array(z.string().min(1)),
  expectedMinutes: z.number().int().positive(),
  safetyNote: z.string().min(1).optional(),
  tracking: trackingPolicySchema,
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
  skippedAt: z.iso.datetime().optional(),
});

export const streakStateSchema = z.object({
  current: z.number().int().nonnegative(),
  longest: z.number().int().nonnegative(),
  lifetimeCompletions: z.number().int().nonnegative(),
  lastCompletedLocalDate: z.iso.date().optional(),
});

export const progressStateSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('counter'),
    current: z.number().int().nonnegative(),
    target: z.number().int().positive(),
    unit: z.string().min(1),
    increments: z.array(z.number().int().positive()).min(1),
  }),
  z.object({
    kind: z.literal('confirmation'),
    confirmed: z.boolean(),
    actionLabel: z.string().min(1),
  }),
  z.object({
    kind: z.literal('checklist'),
    completedItemIds: z.array(z.string().min(1)),
    items: z.array(checklistItemSchema).min(1),
  }),
  z.object({
    kind: z.literal('timer'),
    currentSeconds: z.number().int().nonnegative(),
    targetSeconds: z.number().int().positive(),
    incrementsSeconds: z.array(z.number().int().positive()).min(1),
  }),
]);

export const todayResponseSchema = z.object({
  development: z.literal(true),
  assignment: dailyAssignmentSchema,
  progress: progressStateSchema,
  replacementCount: z.number().int().nonnegative(),
  streak: streakStateSchema,
});

const progressEventBase = {
  eventId: z.uuid(),
  occurredAt: z.iso.datetime(),
};

export const progressEventCommandSchema = z.discriminatedUnion('kind', [
  z.object({
    ...progressEventBase,
    kind: z.literal('count-added'),
    amount: z.number().int().positive(),
  }),
  z.object({ ...progressEventBase, kind: z.literal('confirmation-recorded') }),
  z.object({
    ...progressEventBase,
    kind: z.literal('checklist-item-completed'),
    itemId: z.string().min(1),
  }),
  z.object({
    ...progressEventBase,
    kind: z.literal('time-added'),
    seconds: z.number().int().positive(),
  }),
]);

export const replaceChallengeCommandSchema = z.object({
  reason: z.string().trim().max(300).optional(),
});

export const skipChallengeCommandSchema = z.object({
  reason: z.string().trim().max(300).optional(),
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

export const categoryCountsSchema = z.object({
  body: z.number().int().nonnegative(),
  character: z.number().int().nonnegative(),
  community: z.number().int().nonnegative(),
  creativity: z.number().int().nonnegative(),
});

export const historyResponseSchema = z.object({
  streak: streakStateSchema,
  completedLocalDates: z.array(z.iso.date()),
  completionsByCategory: categoryCountsSchema,
});

export const errorResponseSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
});

export type TodayResponse = z.infer<typeof todayResponseSchema>;
export type ProgressEventCommand = z.infer<typeof progressEventCommandSchema>;
export type ReplaceChallengeCommand = z.infer<typeof replaceChallengeCommandSchema>;
export type CompleteChallengeCommand = z.infer<typeof completeChallengeCommandSchema>;
export type GoodnessEntryResponse = z.infer<typeof goodnessEntrySchema>;
export type WallResponse = z.infer<typeof wallResponseSchema>;
export type HistoryResponse = z.infer<typeof historyResponseSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
