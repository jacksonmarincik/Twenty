import { useAtom } from 'jotai';
import { useCallback } from 'react';

import { persistMessengerAuth } from '@/messenger/states/messengerAuthState';
import {
  messengerTokenState,
  messengerUserState,
} from '@/messenger/states/messengerAuthState';
import { messengerRequest } from '@/messenger/services/messengerApiClient';
import { disconnectMessengerSocket } from '@/messenger/services/messengerSocket';
import { MessengerUser } from '@/messenger/types/messenger.types';

type LoginResponse = { user: MessengerUser; token: string };
type RegisterResponse = { user: MessengerUser; message?: string };

export const useMessengerAuth = () => {
  const [token, setToken] = useAtom(messengerTokenState);
  const [user, setUser] = useAtom(messengerUserState);

  const login = useCallback(
    async (email: string, password: string): Promise<MessengerUser> => {
      const res = await messengerRequest<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      persistMessengerAuth(res.token, res.user);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    },
    [setToken, setUser],
  );

  const register = useCallback(
    async (
      email: string,
      password: string,
      name: string,
    ): Promise<{ user: MessengerUser; message?: string }> => {
      const res = await messengerRequest<RegisterResponse>(
        '/api/auth/register',
        { method: 'POST', body: { email, password, name } },
      );
      return res;
    },
    [],
  );

  const logout = useCallback(() => {
    disconnectMessengerSocket();
    persistMessengerAuth(null, null);
    setToken(null);
    setUser(null);
  }, [setToken, setUser]);

  const refreshMe = useCallback(async (): Promise<MessengerUser | null> => {
    if (token === null) return null;
    try {
      const res = await messengerRequest<{ user: MessengerUser }>(
        '/api/auth/me',
        { token },
      );
      persistMessengerAuth(token, res.user);
      setUser(res.user);
      return res.user;
    } catch {
      return null;
    }
  }, [token, setUser]);

  return { token, user, login, register, logout, refreshMe };
};
