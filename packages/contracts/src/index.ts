import { z } from 'zod';

export const healthResponseSchema = z.object({
  service: z.literal('daily-forge-api'),
  status: z.literal('ok'),
  timestamp: z.iso.datetime(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
