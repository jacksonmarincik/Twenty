const DEFAULT_LOCAL = 'http://localhost:3005';

const fromWindow = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  const envObj = (window as unknown as { _env_?: Record<string, string> })._env_;
  return envObj?.REACT_APP_MESSENGER_BASE_URL;
};

const fromProcess = (): string | undefined => {
  if (typeof process === 'undefined' || !process.env) return undefined;
  return (
    process.env.REACT_APP_MESSENGER_BASE_URL ??
    process.env.VITE_MESSENGER_BASE_URL
  );
};

export const getMessengerBaseUrl = (): string => {
  const resolved = fromWindow() ?? fromProcess();
  if (resolved && resolved.trim().length > 0) {
    return resolved.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.endsWith('localhost') || host === '127.0.0.1') {
      return DEFAULT_LOCAL;
    }
  }
  return DEFAULT_LOCAL;
};

export const MESSENGER_STORAGE_TOKEN_KEY = 'socorro.messenger.token';
export const MESSENGER_STORAGE_USER_KEY = 'socorro.messenger.user';
