import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useState } from 'react';

import { messengerRequest } from '@/messenger/services/messengerApiClient';
import { getMessengerSocket } from '@/messenger/services/messengerSocket';
import { messengerTokenState } from '@/messenger/states/messengerAuthState';
import { MessengerDMThread } from '@/messenger/types/messenger.types';

export const useMessengerDMThreads = () => {
  const token = useAtomValue(messengerTokenState);
  const [threads, setThreads] = useState<MessengerDMThread[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (token === null) return;
    setLoading(true);
    setError(null);
    try {
      const res = await messengerRequest<{ threads: MessengerDMThread[] }>(
        '/api/dm/threads',
        { token },
      );
      setThreads(res.threads);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load DM threads',
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const socket = getMessengerSocket(token);
    if (!socket) return;
    const handler = () => {
      void refresh();
    };
    socket.on('conversation_update', handler);
    return () => {
      socket.off('conversation_update', handler);
    };
  }, [token, refresh]);

  const startThread = useCallback(
    async (otherUserId: string): Promise<MessengerDMThread> => {
      const created = await messengerRequest<MessengerDMThread>(
        '/api/dm/threads',
        { method: 'POST', body: { other_user_id: otherUserId }, token },
      );
      await refresh();
      return created;
    },
    [token, refresh],
  );

  return { threads, loading, error, refresh, startThread };
};
