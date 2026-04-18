import { styled } from '@linaria/react';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { MessengerAttachment } from '@/messenger/types/messenger.types';

const StyledCard = styled.a<{ clickable: boolean }>`
  align-items: center;
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.primary};
  cursor: ${({ clickable }) => (clickable === true ? 'pointer' : 'default')};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  max-width: 320px;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
  text-decoration: none;
  transition: background 120ms ease;

  &:hover {
    background: ${({ clickable }) =>
      clickable === true
        ? themeCssVariables.background.transparent.light
        : themeCssVariables.background.primary};
  }
`;

const StyledAvatar = styled.div<{ background: string }>`
  align-items: center;
  background: ${({ background }) => background};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.inverted};
  display: flex;
  flex-shrink: 0;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  height: 36px;
  justify-content: center;
  overflow: hidden;
  width: 36px;
`;

const StyledAvatarImage = styled.img`
  height: 100%;
  object-fit: cover;
  width: 100%;
`;

const StyledText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const StyledLabel = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledSubtitle = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledKind = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

// Deterministic palette so the same record always gets the same avatar color.
const AVATAR_PALETTE = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#10b981',
  '#14b8a6',
  '#0ea5e9',
  '#6366f1',
];

const colorFromSeed = (seed: string): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[index];
};

const initialsFor = (label: string): string => {
  const parts = label
    .split(/\s+/)
    .filter((part) => part.length > 0)
    .slice(0, 2);
  if (parts.length === 0) return '?';
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
};

const humanObjectLabel = (objectName: string): string => {
  const trimmed = objectName.replace(/[-_]+/g, ' ').trim();
  if (trimmed.length === 0) return 'Record';
  return trimmed[0].toUpperCase() + trimmed.slice(1);
};

type Props = {
  attachment: MessengerAttachment;
  interactive?: boolean;
};

export const MessengerAttachmentCard = ({
  attachment,
  interactive = true,
}: Props) => {
  const navigate = useNavigate();

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (!interactive) {
        event.preventDefault();
        return;
      }
      if (attachment.type === 'twenty_record' && attachment.url) {
        event.preventDefault();
        navigate(attachment.url);
      }
    },
    [attachment, interactive, navigate],
  );

  if (attachment.type === 'twenty_record') {
    const href = interactive && attachment.url ? attachment.url : undefined;
    const seed = `${attachment.objectName}:${attachment.id}`;
    return (
      <StyledCard clickable={interactive} href={href} onClick={handleClick}>
        <StyledAvatar background={colorFromSeed(seed)}>
          {attachment.avatarUrl ? (
            <StyledAvatarImage alt="" src={attachment.avatarUrl} />
          ) : (
            initialsFor(attachment.label)
          )}
        </StyledAvatar>
        <StyledText>
          <StyledKind>{humanObjectLabel(attachment.objectName)}</StyledKind>
          <StyledLabel>{attachment.label}</StyledLabel>
          {attachment.subtitle ? (
            <StyledSubtitle>{attachment.subtitle}</StyledSubtitle>
          ) : null}
        </StyledText>
      </StyledCard>
    );
  }

  if (attachment.type === 'link') {
    return (
      <StyledCard
        clickable={interactive}
        href={interactive ? attachment.url : undefined}
        rel="noopener noreferrer"
        target="_blank"
      >
        <StyledAvatar background={colorFromSeed(attachment.url)}>
          {attachment.imageUrl ? (
            <StyledAvatarImage alt="" src={attachment.imageUrl} />
          ) : (
            '🔗'
          )}
        </StyledAvatar>
        <StyledText>
          <StyledKind>Link</StyledKind>
          <StyledLabel>{attachment.label ?? attachment.url}</StyledLabel>
          {attachment.description ? (
            <StyledSubtitle>{attachment.description}</StyledSubtitle>
          ) : null}
        </StyledText>
      </StyledCard>
    );
  }

  // file
  return (
    <StyledCard
      clickable={interactive}
      href={interactive ? attachment.url : undefined}
      rel="noopener noreferrer"
      target="_blank"
    >
      <StyledAvatar background={colorFromSeed(attachment.name)}>📎</StyledAvatar>
      <StyledText>
        <StyledKind>File</StyledKind>
        <StyledLabel>{attachment.name}</StyledLabel>
        {attachment.mimeType ? (
          <StyledSubtitle>{attachment.mimeType}</StyledSubtitle>
        ) : null}
      </StyledText>
    </StyledCard>
  );
};
