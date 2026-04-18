import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useState } from 'react';

import { messengerRequest } from '@/messenger/services/messengerApiClient';
import { getMessengerSocket } from '@/messenger/services/messengerSocket';
import { messengerTokenState } from '@/messenger/states/messengerAuthState';
import { MessengerChannel } from '@/messenger/types/messenger.types';

export const useMessengerChannels = () => {
  const token = useAtomValue(messengerTokenState);
  const [channels, setChannels] = useState<MessengerChannel[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (token === null) return;
    setLoading(true);
    setError(null);
    try {
      const res = await messengerRequest<{ channels: MessengerChannel[] }>(
        '/api/channels',
        { token },
      );
      setChannels(res.channels);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load channels');
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
    socket.on('channel_renamed', handler);
    socket.on('channel_members_changed', handler);
    return () => {
      socket.off('conversation_update', handler);
      socket.off('channel_renamed', handler);
      socket.off('channel_members_changed', handler);
    };
  }, [token, refresh]);

  const createChannel = useCallback(
    async (
      name: string,
      type: MessengerChannel['type'],
      memberIds: string[],
    ): Promise<MessengerChannel> => {
      const created = await messengerRequest<MessengerChannel>(
        '/api/channels',
        { method: 'POST', body: { name, type, memberIds }, token },
      );
      await refresh();
      return created;
    },
    [token, refresh],
  );

  return { channels, loading, error, refresh, createChannel };
};
