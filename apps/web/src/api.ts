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

export function addCountProgress(assignmentId: string, amount: number): Promise<TodayResponse> {
  return request(
    '/api/v1/challenges/' + encodeURIComponent(assignmentId) + '/progress-events',
    todayResponseSchema,
    {
      method: 'POST',
      body: JSON.stringify({
        eventId: crypto.randomUUID(),
        amount,
        occurredAt: new Date().toISOString(),
      }),
    },
  );
}

export function completeToday(assignmentId: string): Promise<TodayResponse> {
  return request(
    '/api/v1/challenges/' + encodeURIComponent(assignmentId) + '/complete',
    todayResponseSchema,
    {
      method: 'POST',
      body: JSON.stringify({
        completionId: crypto.randomUUID(),
        wallEntryId: crypto.randomUUID(),
        completedAt: new Date().toISOString(),
      }),
    },
  );
}

export function loadWall(signal?: AbortSignal): Promise<WallResponse> {
  return request('/api/v1/wall', wallResponseSchema, signal ? { signal } : undefined);
}

export function loadHistory(signal?: AbortSignal): Promise<HistoryResponse> {
  return request('/api/v1/history', historyResponseSchema, signal ? { signal } : undefined);
}

export function resetDevelopmentData(): Promise<TodayResponse> {
  return request('/api/v1/development/reset', todayResponseSchema, {
    method: 'POST',
  });
}
