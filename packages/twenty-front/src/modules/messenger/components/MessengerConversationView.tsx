import { styled } from '@linaria/react';
import { Fragment, useEffect, useMemo, useRef } from 'react';
import { IconMessage } from 'twenty-ui/display';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { MessengerComposer } from '@/messenger/components/MessengerComposer';
import { MessengerMessageBubble } from '@/messenger/components/MessengerMessageBubble';
import { useMessengerChannels } from '@/messenger/hooks/useMessengerChannels';
import { useMessengerDMThreads } from '@/messenger/hooks/useMessengerDMThreads';
import { useMessengerMessages } from '@/messenger/hooks/useMessengerMessages';
import { useMessengerUsers } from '@/messenger/hooks/useMessengerUsers';
import {
  MessengerConversationRef,
  MessengerMessage,
} from '@/messenger/types/messenger.types';

const StyledWrapper = styled.section`
  background: ${themeCssVariables.background.primary};
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
`;

const StyledHeader = styled.div`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  height: 48px;
  padding: 0 ${themeCssVariables.spacing[4]};
`;

const StyledTitle = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledMessages = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[4]} 0 ${themeCssVariables.spacing[2]};
`;

const StyledEmpty = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: center;
  text-align: center;
`;

const StyledDaySeparator = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
  justify-content: center;
  padding: ${themeCssVariables.spacing[4]} 0 ${themeCssVariables.spacing[2]};
  text-transform: uppercase;
`;

const StyledTimestamp = styled.div<{ isOwn: boolean }>`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[4]} 0;
  text-align: ${({ isOwn }) => (isOwn === true ? 'right' : 'left')};
`;

const dayKey = (iso: string): string => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

const formatDay = (iso: string): string => {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (dayKey(date.toISOString()) === dayKey(today.toISOString())) return 'Today';
  if (dayKey(date.toISOString()) === dayKey(yesterday.toISOString()))
    return 'Yesterday';
  const sameYear = date.getFullYear() === today.getFullYear();
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: sameYear ? undefined : 'numeric',
    weekday: 'short',
  });
};

const formatTime = (iso: string): string => {
  const date = new Date(iso);
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
};

// Two messages are part of the same "group" (tight spacing, no re-shown
// sender name) when they're from the same sender and less than 5 minutes
// apart. Separate groups get looser spacing + a timestamp at the end of
// the group for the last message.
const MESSAGE_GROUP_WINDOW_MS = 5 * 60 * 1000;

const isGrouped = (
  current: MessengerMessage,
  previous: MessengerMessage | null,
): boolean => {
  if (previous === null) return false;
  if (current.sender_id !== previous.sender_id) return false;
  if (current.is_system === true || previous.is_system === true) return false;
  const delta =
    new Date(current.created_at).getTime() -
    new Date(previous.created_at).getTime();
  return delta <= MESSAGE_GROUP_WINDOW_MS;
};

type Props = {
  selected: MessengerConversationRef | null;
  currentUserId: string | null;
};

export const MessengerConversationView = ({
  selected,
  currentUserId,
}: Props) => {
  const { channels } = useMessengerChannels();
  const { threads } = useMessengerDMThreads();
  const { users } = useMessengerUsers();
  const { messages, loading, send } = useMessengerMessages(selected);

  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el === null) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, selected]);

  const title = useMemo((): string => {
    if (selected === null) return '';
    if (selected.kind === 'channel') {
      const channel = channels.find((c) => c.id === selected.channelId);
      return channel ? `# ${channel.name}` : 'Channel';
    }
    const thread = threads.find((t) => t.id === selected.threadId);
    if (thread) {
      if (thread.other_user?.name) return thread.other_user.name;
      const otherId =
        thread.user1_id === currentUserId ? thread.user2_id : thread.user1_id;
      const other = users.find((u) => u.id === otherId);
      return other?.name ?? 'Direct message';
    }
    return 'Direct message';
  }, [selected, channels, threads, users, currentUserId]);

  if (selected === null) {
    return (
      <StyledWrapper>
        <StyledEmpty>
          <IconMessage size={32} />
          <div>Select a channel or direct message</div>
        </StyledEmpty>
      </StyledWrapper>
    );
  }

  return (
    <StyledWrapper>
      <StyledHeader>
        <StyledTitle>{title}</StyledTitle>
      </StyledHeader>
      <StyledMessages ref={scrollerRef}>
        {loading && messages.length === 0 ? (
          <StyledEmpty>Loading…</StyledEmpty>
        ) : messages.length === 0 ? (
          <StyledEmpty>No messages yet. Say hi.</StyledEmpty>
        ) : (
          messages.map((message, index) => {
            const previous = index > 0 ? messages[index - 1] : null;
            const next = index < messages.length - 1 ? messages[index + 1] : null;
            const isNewDay =
              previous === null ||
              dayKey(previous.created_at) !== dayKey(message.created_at);
            const grouped = isGrouped(message, previous);
            const showSender = !grouped;
            const showTimestamp = !isGrouped(next ?? message, message);
            const isOwn = currentUserId === message.sender_id;
            return (
              <Fragment key={message.id}>
                {isNewDay ? (
                  <StyledDaySeparator>
                    {formatDay(message.created_at)}
                  </StyledDaySeparator>
                ) : null}
                <MessengerMessageBubble
                  currentUserId={currentUserId}
                  message={message}
                  showSender={showSender}
                  tight={grouped}
                />
                {showTimestamp && message.is_system !== true ? (
                  <StyledTimestamp isOwn={isOwn}>
                    {formatTime(message.created_at)}
                  </StyledTimestamp>
                ) : null}
              </Fragment>
            );
          })
        )}
      </StyledMessages>
      <MessengerComposer
        onSend={async (payload) => {
          await send({
            body: payload.body,
            attachments: payload.attachments,
          });
        }}
      />
    </StyledWrapper>
  );
};
