import { styled } from '@linaria/react';
import { KeyboardEvent, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { IconSend } from 'twenty-ui/display';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledComposer = styled.form`
  align-items: flex-end;
  background: ${themeCssVariables.background.primary};
  border-top: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
`;

const StyledTextarea = styled(TextareaAutosize)`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.primary};
  flex: 1;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.md};
  outline: none;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
  resize: none;

  &:focus {
    border-color: ${themeCssVariables.border.color.medium};
  }
`;

const StyledSendButton = styled.button`
  align-items: center;
  background: ${themeCssVariables.background.invertedPrimary};
  border: none;
  border-radius: ${themeCssVariables.border.radius.rounded};
  color: ${themeCssVariables.font.color.inverted};
  cursor: pointer;
  display: flex;
  height: 36px;
  justify-content: center;
  width: 36px;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

type Props = {
  disabled?: boolean;
  onSend: (body: string) => Promise<void> | void;
};

export const MessengerComposer = ({ disabled, onSend }: Props) => {
  const [value, setValue] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const canSend = !disabled && !submitting && value.trim().length > 0;

  const submit = async () => {
    if (!canSend) return;
    const payload = value.trim();
    setSubmitting(true);
    try {
      await onSend(payload);
      setValue('');
    } finally {
      setSubmitting(false);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  };

  return (
    <StyledComposer
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <StyledTextarea
        maxRows={8}
        minRows={1}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Type a message…"
        value={value}
      />
      <StyledSendButton aria-label="Send" disabled={!canSend} type="submit">
        <IconSend size={16} />
      </StyledSendButton>
    </StyledComposer>
  );
};
