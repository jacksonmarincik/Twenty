import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { MessengerAttachmentCard } from '@/messenger/components/MessengerAttachmentCard';
import { MessengerMessage } from '@/messenger/types/messenger.types';

const StyledRow = styled.div<{ isOwn: boolean; isSystem: boolean; tight: boolean }>`
  display: flex;
  justify-content: ${({ isOwn, isSystem }) =>
    isSystem === true ? 'center' : isOwn === true ? 'flex-end' : 'flex-start'};
  padding: 0 ${themeCssVariables.spacing[4]};
  padding-top: ${({ tight }) => (tight === true ? '2px' : themeCssVariables.spacing[1])};
`;

const StyledBubbleStack = styled.div<{ isOwn: boolean }>`
  align-items: ${({ isOwn }) => (isOwn === true ? 'flex-end' : 'flex-start')};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  max-width: min(72%, 560px);
`;

const StyledBubble = styled.div<{ isOwn: boolean; hasBody: boolean }>`
  background: ${({ isOwn, hasBody }) =>
    hasBody === false
      ? 'transparent'
      : isOwn === true
        ? themeCssVariables.background.invertedPrimary
        : themeCssVariables.background.secondary};
  border: ${({ isOwn, hasBody }) =>
    hasBody === false
      ? 'none'
      : isOwn === true
        ? '1px solid transparent'
        : `1px solid ${themeCssVariables.border.color.light}`};
  border-radius: 18px;
  color: ${({ isOwn }) =>
    isOwn === true
      ? themeCssVariables.font.color.inverted
      : themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  line-height: 1.4;
  padding: ${({ hasBody }) =>
    hasBody === true
      ? `${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]}`
      : '0'};
  white-space: pre-wrap;
  word-break: break-word;
`;

const StyledSender = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  margin-bottom: ${themeCssVariables.spacing[1]};
  padding: 0 ${themeCssVariables.spacing[1]};
`;

const StyledSystem = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  font-style: italic;
  text-align: center;
`;

const StyledImage = styled.img`
  border-radius: ${themeCssVariables.border.radius.sm};
  display: block;
  margin-bottom: ${themeCssVariables.spacing[1]};
  max-height: 320px;
  max-width: 100%;
`;

const StyledAttachments = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
`;

type Props = {
  message: MessengerMessage;
  currentUserId: string | null;
  showSender: boolean;
  tight?: boolean;
};

export const MessengerMessageBubble = ({
  message,
  currentUserId,
  showSender,
  tight,
}: Props) => {
  const isOwn = currentUserId !== null && message.sender_id === currentUserId;
  const isSystem = message.is_system === true;
  const attachments = message.attachments ?? [];
  const hasBody = message.body.trim().length > 0;

  if (isSystem) {
    return (
      <StyledRow isOwn={false} isSystem={true} tight={tight === true}>
        <StyledSystem>{message.body}</StyledSystem>
      </StyledRow>
    );
  }

  return (
    <StyledRow isOwn={isOwn} isSystem={false} tight={tight === true}>
      <StyledBubbleStack isOwn={isOwn}>
        {showSender && !isOwn ? (
          <StyledSender>{message.sender_name ?? 'Someone'}</StyledSender>
        ) : null}
        {hasBody || message.image_url ? (
          <StyledBubble hasBody={hasBody || Boolean(message.image_url)} isOwn={isOwn}>
            {message.image_url ? (
              <StyledImage alt="attachment" src={message.image_url} />
            ) : null}
            {hasBody ? message.body : null}
          </StyledBubble>
        ) : null}
        {attachments.length > 0 ? (
          <StyledAttachments>
            {attachments.map((attachment, index) => (
              <MessengerAttachmentCard
                attachment={attachment}
                key={`${message.id}-${index}`}
              />
            ))}
          </StyledAttachments>
        ) : null}
      </StyledBubbleStack>
    </StyledRow>
  );
};
