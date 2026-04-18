import { styled } from '@linaria/react';
import { useMemo, useState } from 'react';
import { IconMessageCirclePlus, IconPlus } from 'twenty-ui/display';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { useMessengerChannels } from '@/messenger/hooks/useMessengerChannels';
import { useMessengerDMThreads } from '@/messenger/hooks/useMessengerDMThreads';
import { useMessengerUsers } from '@/messenger/hooks/useMessengerUsers';
import {
  MessengerChannel,
  MessengerConversationRef,
  MessengerDMThread,
} from '@/messenger/types/messenger.types';

const StyledSidebar = styled.aside`
  background: ${themeCssVariables.background.secondary};
  border-right: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-direction: column;
  min-width: 260px;
  width: 260px;
`;

const StyledHeader = styled.div`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  height: 48px;
  justify-content: space-between;
  padding: 0 ${themeCssVariables.spacing[3]};
`;

const StyledHeaderTitle = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledHeaderActions = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledIconButton = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: flex;
  height: 28px;
  justify-content: center;
  padding: 0;
  width: 28px;

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
    color: ${themeCssVariables.font.color.primary};
  }
`;

const StyledScroll = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[2]};
`;

const StyledSectionTitle = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  letter-spacing: 0.04em;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[2]}
    ${themeCssVariables.spacing[1]};
  text-transform: uppercase;
`;

const StyledItem = styled.button<{ active?: boolean }>`
  align-items: center;
  background: ${({ active }) =>
    active === true
      ? themeCssVariables.background.transparent.medium
      : 'transparent'};
  border: none;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: flex;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${({ active }) =>
    active === true
      ? themeCssVariables.font.weight.medium
      : themeCssVariables.font.weight.regular};
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
  text-align: left;
  width: 100%;

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
  }
`;

const StyledHash = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.md};
`;

const StyledEmpty = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
`;

const StyledInlineForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
`;

const StyledInput = styled.input`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  outline: none;
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};
  &:focus {
    border-color: ${themeCssVariables.border.color.medium};
  }
`;

const StyledSmallButton = styled.button`
  background: ${themeCssVariables.background.invertedPrimary};
  border: none;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.inverted};
  cursor: pointer;
  font-size: ${themeCssVariables.font.size.xs};
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

type Props = {
  selected: MessengerConversationRef | null;
  onSelect: (ref: MessengerConversationRef) => void;
  currentUserId: string | null;
};

const isSameRef = (
  a: MessengerConversationRef | null,
  b: MessengerConversationRef,
): boolean => {
  if (a === null) return false;
  if (a.kind !== b.kind) return false;
  if (a.kind === 'channel' && b.kind === 'channel')
    return a.channelId === b.channelId;
  if (a.kind === 'dm' && b.kind === 'dm') return a.threadId === b.threadId;
  return false;
};

export const MessengerSidebar = ({
  selected,
  onSelect,
  currentUserId,
}: Props) => {
  const { channels, createChannel } = useMessengerChannels();
  const { threads, startThread } = useMessengerDMThreads();
  const { users } = useMessengerUsers();

  const [newChannelOpen, setNewChannelOpen] = useState<boolean>(false);
  const [newChannelName, setNewChannelName] = useState<string>('');
  const [newDmOpen, setNewDmOpen] = useState<boolean>(false);

  const dmLabel = useMemo(() => {
    const byId = new Map<string, { id: string; name: string; email: string }>();
    users.forEach((u) => byId.set(u.id, u));
    return (thread: MessengerDMThread): string => {
      if (thread.other_user?.name) return thread.other_user.name;
      const otherId =
        thread.user1_id === currentUserId ? thread.user2_id : thread.user1_id;
      return byId.get(otherId)?.name ?? 'Direct message';
    };
  }, [users, currentUserId]);

  const channelLabel = (channel: MessengerChannel): string => channel.name;

  const handleCreateChannel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = newChannelName.trim();
    if (name.length === 0) return;
    const created = await createChannel(name, 'public', []);
    setNewChannelName('');
    setNewChannelOpen(false);
    onSelect({ kind: 'channel', channelId: created.id });
  };

  return (
    <StyledSidebar>
      <StyledHeader>
        <StyledHeaderTitle>Messages</StyledHeaderTitle>
      </StyledHeader>
      <StyledScroll>
        <StyledSectionTitle>Channels</StyledSectionTitle>
        {channels.length === 0 && !newChannelOpen ? (
          <StyledEmpty>No channels yet</StyledEmpty>
        ) : null}
        {channels.map((channel) => (
          <StyledItem
            active={isSameRef(selected, {
              kind: 'channel',
              channelId: channel.id,
            })}
            key={channel.id}
            onClick={() =>
              onSelect({ kind: 'channel', channelId: channel.id })
            }
            type="button"
          >
            <StyledHash>#</StyledHash>
            <span>{channelLabel(channel)}</span>
          </StyledItem>
        ))}
        {newChannelOpen ? (
          <StyledInlineForm onSubmit={handleCreateChannel}>
            <StyledInput
              autoFocus
              onChange={(e) => setNewChannelName(e.target.value)}
              placeholder="new-channel"
              value={newChannelName}
            />
            <StyledSmallButton
              disabled={newChannelName.trim().length === 0}
              type="submit"
            >
              Create
            </StyledSmallButton>
          </StyledInlineForm>
        ) : (
          <StyledItem
            as="button"
            onClick={() => setNewChannelOpen(true)}
            type="button"
          >
            <IconPlus size={14} />
            <span>New channel</span>
          </StyledItem>
        )}

        <StyledSectionTitle>Direct messages</StyledSectionTitle>
        {threads.length === 0 && !newDmOpen ? (
          <StyledEmpty>No direct messages yet</StyledEmpty>
        ) : null}
        {threads.map((thread) => (
          <StyledItem
            active={isSameRef(selected, {
              kind: 'dm',
              threadId: thread.id,
            })}
            key={thread.id}
            onClick={() => onSelect({ kind: 'dm', threadId: thread.id })}
            type="button"
          >
            <span>{dmLabel(thread)}</span>
          </StyledItem>
        ))}
        {newDmOpen ? (
          <>
            {users.length === 0 ? (
              <StyledEmpty>No other users available</StyledEmpty>
            ) : (
              users.map((user) => (
                <StyledItem
                  as="button"
                  key={user.id}
                  onClick={async () => {
                    const thread = await startThread(user.id);
                    setNewDmOpen(false);
                    onSelect({ kind: 'dm', threadId: thread.id });
                  }}
                  type="button"
                >
                  <IconMessageCirclePlus size={14} />
                  <span>{user.name}</span>
                </StyledItem>
              ))
            )}
          </>
        ) : (
          <StyledItem
            as="button"
            onClick={() => setNewDmOpen(true)}
            type="button"
          >
            <IconPlus size={14} />
            <span>New direct message</span>
          </StyledItem>
        )}
      </StyledScroll>
      <StyledHeader>
        <StyledHeaderActions>
          <StyledIconButton
            aria-label="New channel"
            onClick={() => setNewChannelOpen(true)}
            type="button"
          >
            <IconPlus size={16} />
          </StyledIconButton>
          <StyledIconButton
            aria-label="New direct message"
            onClick={() => setNewDmOpen(true)}
            type="button"
          >
            <IconMessageCirclePlus size={16} />
          </StyledIconButton>
        </StyledHeaderActions>
      </StyledHeader>
    </StyledSidebar>
  );
};
