import { styled } from '@linaria/react';
import { KeyboardEvent, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { IconPaperclip, IconSend, IconX } from 'twenty-ui/display';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { MessengerAttachmentCard } from '@/messenger/components/MessengerAttachmentCard';
import { MessengerRecordPicker } from '@/messenger/components/MessengerRecordPicker';
import {
  MessengerAttachment,
  MessengerTwentyRecordAttachment,
} from '@/messenger/types/messenger.types';

const StyledContainer = styled.div`
  background: ${themeCssVariables.background.primary};
  border-top: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
`;

const StyledAttachmentRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledPendingAttachment = styled.div`
  align-items: flex-start;
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
  position: relative;
`;

const StyledRemoveButton = styled.button`
  align-items: center;
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.rounded};
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: flex;
  height: 22px;
  justify-content: center;
  margin-left: -18px;
  margin-top: -6px;
  padding: 0;
  position: relative;
  width: 22px;
  z-index: 1;

  &:hover {
    color: ${themeCssVariables.font.color.primary};
  }
`;

const StyledInputRow = styled.form`
  align-items: flex-end;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
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

const StyledActionButton = styled.button<{ primary?: boolean }>`
  align-items: center;
  background: ${({ primary }) =>
    primary === true
      ? themeCssVariables.background.invertedPrimary
      : themeCssVariables.background.secondary};
  border: 1px solid
    ${({ primary }) =>
      primary === true ? 'transparent' : themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.rounded};
  color: ${({ primary }) =>
    primary === true
      ? themeCssVariables.font.color.inverted
      : themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: flex;
  height: 36px;
  justify-content: center;
  width: 36px;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  &:hover:not(:disabled) {
    color: ${({ primary }) =>
      primary === true
        ? themeCssVariables.font.color.inverted
        : themeCssVariables.font.color.primary};
  }
`;

export type SendPayload = {
  body: string;
  attachments: MessengerAttachment[];
};

type Props = {
  disabled?: boolean;
  initialAttachments?: MessengerAttachment[];
  onSend: (payload: SendPayload) => Promise<void> | void;
};

export const MessengerComposer = ({
  disabled,
  initialAttachments,
  onSend,
}: Props) => {
  const [value, setValue] = useState<string>('');
  const [attachments, setAttachments] = useState<MessengerAttachment[]>(
    initialAttachments ?? [],
  );
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [pickerOpen, setPickerOpen] = useState<boolean>(false);

  const canSend =
    !disabled &&
    !submitting &&
    (value.trim().length > 0 || attachments.length > 0);

  const submit = async () => {
    if (!canSend) return;
    const payload: SendPayload = {
      body: value.trim(),
      attachments,
    };
    setSubmitting(true);
    try {
      await onSend(payload);
      setValue('');
      setAttachments([]);
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

  const addAttachment = (attachment: MessengerTwentyRecordAttachment) => {
    setAttachments((prev) => {
      const alreadyPresent = prev.some(
        (existing) =>
          existing.type === 'twenty_record' &&
          existing.id === attachment.id &&
          existing.objectName === attachment.objectName,
      );
      if (alreadyPresent) return prev;
      return [...prev, attachment];
    });
    setPickerOpen(false);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      <StyledContainer>
        {attachments.length > 0 ? (
          <StyledAttachmentRow>
            {attachments.map((attachment, index) => (
              <StyledPendingAttachment key={`${index}-${attachment.type}`}>
                <MessengerAttachmentCard
                  attachment={attachment}
                  interactive={false}
                />
                <StyledRemoveButton
                  aria-label="Remove attachment"
                  onClick={() => removeAttachment(index)}
                  type="button"
                >
                  <IconX size={12} />
                </StyledRemoveButton>
              </StyledPendingAttachment>
            ))}
          </StyledAttachmentRow>
        ) : null}
        <StyledInputRow
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <StyledActionButton
            aria-label="Attach from CRM"
            disabled={disabled}
            onClick={() => setPickerOpen(true)}
            type="button"
          >
            <IconPaperclip size={16} />
          </StyledActionButton>
          <StyledTextarea
            maxRows={8}
            minRows={1}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type a message…"
            value={value}
          />
          <StyledActionButton
            aria-label="Send"
            disabled={!canSend}
            primary
            type="submit"
          >
            <IconSend size={16} />
          </StyledActionButton>
        </StyledInputRow>
      </StyledContainer>
      {pickerOpen ? (
        <MessengerRecordPicker
          onCancel={() => setPickerOpen(false)}
          onPick={addAttachment}
        />
      ) : null}
    </>
  );
};
