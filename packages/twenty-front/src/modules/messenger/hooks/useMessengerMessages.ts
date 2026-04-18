import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useState } from 'react';

import { messengerRequest } from '@/messenger/services/messengerApiClient';
import { getMessengerSocket } from '@/messenger/services/messengerSocket';
import { messengerTokenState } from '@/messenger/states/messengerAuthState';
import {
  MessengerConversationRef,
  MessengerMessage,
} from '@/messenger/types/messenger.types';

const listPath = (ref: MessengerConversationRef): string =>
  ref.kind === 'channel'
    ? `/api/messages/channel/${ref.channelId}`
    : `/api/messages/dm/${ref.threadId}`;

const roomName = (ref: MessengerConversationRef): string =>
  ref.kind === 'channel' ? `channel:${ref.channelId}` : `dm:${ref.threadId}`;

const joinEvent = (ref: MessengerConversationRef): string =>
  ref.kind === 'channel' ? 'join_channel' : 'join_dm';

const leaveEvent = (ref: MessengerConversationRef): string =>
  ref.kind === 'channel' ? 'leave_channel' : 'leave_dm';

const roomId = (ref: MessengerConversationRef): string =>
  ref.kind === 'channel' ? ref.channelId : ref.threadId;

const belongsToConversation = (
  message: MessengerMessage,
  ref: MessengerConversationRef,
): boolean => {
  if (ref.kind === 'channel') return message.channel_id === ref.channelId;
  return message.thread_id === ref.threadId;
};

export const useMessengerMessages = (ref: MessengerConversationRef | null) => {
  const token = useAtomValue(messengerTokenState);
  const [messages, setMessages] = useState<MessengerMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (ref === null || token === null) {
      setMessages([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await messengerRequest<{ messages: MessengerMessage[] }>(
        listPath(ref),
        { token },
      );
      setMessages(
        [...res.messages].sort((a, b) =>
          a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [ref, token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (ref === null || token === null) return;
    const socket = getMessengerSocket(token);
    if (!socket) return;
    const id = roomId(ref);
    const join = joinEvent(ref);
    const leave = leaveEvent(ref);
    const onNewMessage = (message: MessengerMessage) => {
      if (!belongsToConversation(message, ref)) return;
      setMessages((prev) => {
        if (prev.some((existing) => existing.id === message.id)) return prev;
        return [...prev, message];
      });
    };
    const attach = () => {
      socket.emit(join, id);
      socket.on('new_message', onNewMessage);
    };
    if (socket.connected) {
      attach();
    } else {
      socket.on('connect', attach);
    }
    return () => {
      socket.off('new_message', onNewMessage);
      socket.off('connect', attach);
      socket.emit(leave, id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref?.kind, ref?.kind === 'channel' ? ref.channelId : ref?.threadId, token]);

  const send = useCallback(
    async (body: string): Promise<MessengerMessage | null> => {
      if (ref === null || token === null || body.trim().length === 0) {
        return null;
      }
      const path = listPath(ref);
      const created = await messengerRequest<MessengerMessage>(path, {
        method: 'POST',
        body: { body },
        token,
      });
      setMessages((prev) =>
        prev.some((existing) => existing.id === created.id)
          ? prev
          : [...prev, created],
      );
      return created;
    },
    [ref, token],
  );

  return { messages, loading, error, refresh, send, roomName: ref ? roomName(ref) : '' };
};
