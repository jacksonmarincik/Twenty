import { getMessengerBaseUrl } from '@/messenger/config/messengerConfig';

export class MessengerApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'MessengerApiError';
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  token?: string | null;
  body?: unknown;
  query?: Record<string, string | undefined>;
  headers?: Record<string, string>;
};

const buildUrl = (
  path: string,
  query?: Record<string, string | undefined>,
): string => {
  const base = getMessengerBaseUrl();
  const url = new URL(
    path.startsWith('/') ? path : `/${path}`,
    base.endsWith('/') ? base : `${base}/`,
  );
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, value);
    }
  }
  return url.toString();
};

export const messengerRequest = async <T,>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> => {
  const { method = 'GET', token, body, query, headers: extraHeaders } = opts;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(extraHeaders ?? {}),
  };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => ({}))
    : await response.text().catch(() => '');
  if (!response.ok) {
    const code =
      (payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error: unknown }).error)
        : undefined) ?? `HTTP_${response.status}`;
    const message =
      (payload && typeof payload === 'object' && 'message' in payload
        ? String((payload as { message: unknown }).message)
        : undefined) ?? response.statusText;
    throw new MessengerApiError(response.status, code, message);
  }
  return payload as T;
};
