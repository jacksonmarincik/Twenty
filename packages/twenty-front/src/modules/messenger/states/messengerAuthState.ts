import { atom } from 'jotai';

import {
  MESSENGER_STORAGE_TOKEN_KEY,
  MESSENGER_STORAGE_USER_KEY,
} from '@/messenger/config/messengerConfig';
import { MessengerUser } from '@/messenger/types/messenger.types';

const safeRead = (key: string): string | null => {
  try {
    return typeof window === 'undefined'
      ? null
      : window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeWrite = (key: string, value: string | null) => {
  try {
    if (typeof window === 'undefined') return;
    if (value === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // ignore storage failures (private mode etc.)
  }
};

const loadUser = (): MessengerUser | null => {
  const raw = safeRead(MESSENGER_STORAGE_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MessengerUser;
  } catch {
    return null;
  }
};

export const messengerTokenState = atom<string | null>(
  safeRead(MESSENGER_STORAGE_TOKEN_KEY),
);

export const messengerUserState = atom<MessengerUser | null>(loadUser());

export const messengerIsAuthenticatedState = atom((get) => {
  return get(messengerTokenState) !== null && get(messengerUserState) !== null;
});

export const persistMessengerAuth = (
  token: string | null,
  user: MessengerUser | null,
) => {
  safeWrite(MESSENGER_STORAGE_TOKEN_KEY, token);
  safeWrite(
    MESSENGER_STORAGE_USER_KEY,
    user === null ? null : JSON.stringify(user),
  );
};
