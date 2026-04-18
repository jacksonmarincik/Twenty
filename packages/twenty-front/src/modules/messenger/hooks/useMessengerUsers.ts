import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useState } from 'react';

import { messengerRequest } from '@/messenger/services/messengerApiClient';
import { messengerTokenState } from '@/messenger/states/messengerAuthState';

type MinimalUser = { id: string; name: string; email: string };

export const useMessengerUsers = () => {
  const token = useAtomValue(messengerTokenState);
  const [users, setUsers] = useState<MinimalUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (token === null) return;
    setLoading(true);
    setError(null);
    try {
      const res = await messengerRequest<{ users: MinimalUser[] }>(
        '/api/users',
        { token },
      );
      setUsers(res.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { users, loading, error, refresh };
};
