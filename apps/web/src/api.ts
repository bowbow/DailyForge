import {
  errorResponseSchema,
  historyResponseSchema,
  todayResponseSchema,
  wallResponseSchema,
  type HistoryResponse,
  type TodayResponse,
  type WallResponse,
} from '@daily-forge/contracts';

type Parser<T> = {
  parse(value: unknown): T;
};

async function request<T>(url: string, parser: Parser<T>, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body) {
    headers.set('content-type', 'application/json');
  }
  const response = await fetch(url, {
    ...init,
    headers,
  });
  const body: unknown = await response.json();
  if (!response.ok) {
    const parsed = errorResponseSchema.safeParse(body);
    throw new Error(
      parsed.success ? parsed.data.message : 'Daily Forge could not complete the request.',
    );
  }
  return parser.parse(body);
}

export function loadToday(signal?: AbortSignal): Promise<TodayResponse> {
  return request('/api/v1/today', todayResponseSchema, signal ? { signal } : undefined);
}

export function acceptToday(): Promise<TodayResponse> {
  return request('/api/v1/today/accept', todayResponseSchema, {
    method: 'POST',
  });
}

export function replaceToday(): Promise<TodayResponse> {
  return request('/api/v1/today/replace', todayResponseSchema, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

function addProgress(
  assignmentId: string,
  progress: Record<string, unknown>,
): Promise<TodayResponse> {
  return request(
    '/api/v1/challenges/' + encodeURIComponent(assignmentId) + '/progress-events',
    todayResponseSchema,
    {
      method: 'POST',
      body: JSON.stringify({
        eventId: crypto.randomUUID(),
        occurredAt: new Date().toISOString(),
        ...progress,
      }),
    },
  );
}

export function addCountProgress(assignmentId: string, amount: number): Promise<TodayResponse> {
  return addProgress(assignmentId, { kind: 'count-added', amount });
}

export function confirmProgress(assignmentId: string): Promise<TodayResponse> {
  return addProgress(assignmentId, { kind: 'confirmation-recorded' });
}

export function completeChecklistItem(
  assignmentId: string,
  itemId: string,
): Promise<TodayResponse> {
  return addProgress(assignmentId, { kind: 'checklist-item-completed', itemId });
}

export function addTimeProgress(assignmentId: string, seconds: number): Promise<TodayResponse> {
  return addProgress(assignmentId, { kind: 'time-added', seconds });
}

export function completeToday(assignmentId: string, reflection?: string): Promise<TodayResponse> {
  return request(
    '/api/v1/challenges/' + encodeURIComponent(assignmentId) + '/complete',
    todayResponseSchema,
    {
      method: 'POST',
      body: JSON.stringify({
        completionId: crypto.randomUUID(),
        wallEntryId: crypto.randomUUID(),
        completedAt: new Date().toISOString(),
        ...(reflection ? { reflection } : {}),
      }),
    },
  );
}

export function loadWall(category?: string, signal?: AbortSignal): Promise<WallResponse> {
  const query = category ? '?category=' + encodeURIComponent(category) : '';
  return request('/api/v1/wall' + query, wallResponseSchema, signal ? { signal } : undefined);
}

export function loadHistory(signal?: AbortSignal): Promise<HistoryResponse> {
  return request('/api/v1/history', historyResponseSchema, signal ? { signal } : undefined);
}

export function resetDevelopmentData(): Promise<TodayResponse> {
  return request('/api/v1/development/reset', todayResponseSchema, {
    method: 'POST',
  });
}
