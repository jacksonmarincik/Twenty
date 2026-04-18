import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { MessengerMessage } from '@/messenger/types/messenger.types';

const StyledRow = styled.div<{ isOwn: boolean; isSystem: boolean }>`
  display: flex;
  justify-content: ${({ isOwn, isSystem }) =>
    isSystem === true ? 'center' : isOwn === true ? 'flex-end' : 'flex-start'};
  padding: 0 ${themeCssVariables.spacing[4]};
`;

const StyledBubble = styled.div<{ isOwn: boolean }>`
  background: ${({ isOwn }) =>
    isOwn === true
      ? themeCssVariables.background.invertedPrimary
      : themeCssVariables.background.secondary};
  border: 1px solid
    ${({ isOwn }) =>
      isOwn === true
        ? 'transparent'
        : themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${({ isOwn }) =>
    isOwn === true
      ? themeCssVariables.font.color.inverted
      : themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  max-width: min(72%, 560px);
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
  white-space: pre-wrap;
  word-break: break-word;
`;

const StyledSender = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  margin-bottom: ${themeCssVariables.spacing[1]};
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

type Props = {
  message: MessengerMessage;
  currentUserId: string | null;
  showSender: boolean;
};

export const MessengerMessageBubble = ({
  message,
  currentUserId,
  showSender,
}: Props) => {
  const isOwn = currentUserId !== null && message.sender_id === currentUserId;
  const isSystem = message.is_system === true;

  if (isSystem) {
    return (
      <StyledRow isOwn={false} isSystem={true}>
        <StyledSystem>{message.body}</StyledSystem>
      </StyledRow>
    );
  }

  return (
    <StyledRow isOwn={isOwn} isSystem={false}>
      <div>
        {showSender && !isOwn ? (
          <StyledSender>{message.sender_name ?? 'Someone'}</StyledSender>
        ) : null}
        <StyledBubble isOwn={isOwn}>
          {message.image_url ? (
            <StyledImage alt="attachment" src={message.image_url} />
          ) : null}
          {message.body}
        </StyledBubble>
      </div>
    </StyledRow>
  );
};
