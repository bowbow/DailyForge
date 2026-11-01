import { type CreativeWork, type CreativeWorkStatus } from './types';

export function setCreativeWorkStatus(
  work: CreativeWork,
  status: CreativeWorkStatus,
  updatedAt: string,
): CreativeWork {
  if (work.status === status) return work;
  return { ...work, status, updatedAt };
}
