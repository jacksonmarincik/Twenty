import { styled } from '@linaria/react';
import { useEffect, useMemo, useRef } from 'react';
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
  gap: ${themeCssVariables.spacing[2]};
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[4]} 0;
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
            const showSender =
              previous === null || previous.sender_id !== message.sender_id;
            return (
              <MessengerMessageBubble
                currentUserId={currentUserId}
                key={message.id}
                message={message}
                showSender={showSender}
              />
            );
          })
        )}
      </StyledMessages>
      <MessengerComposer
        onSend={async (body) => {
          await send(body);
        }}
      />
    </StyledWrapper>
  );
};
