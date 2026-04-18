import { styled } from '@linaria/react';
import { FormEvent, useState } from 'react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { useMessengerAuth } from '@/messenger/hooks/useMessengerAuth';

const StyledWrapper = styled.div`
  align-items: center;
  display: flex;
  flex: 1;
  justify-content: center;
  padding: ${themeCssVariables.spacing[8]};
`;

const StyledCard = styled.div`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  box-shadow: ${themeCssVariables.boxShadow.light};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  max-width: 420px;
  padding: ${themeCssVariables.spacing[8]};
  width: 100%;
`;

const StyledTitle = styled.h2`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.xl};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
`;

const StyledSubtitle = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.md};
  margin: 0 0 ${themeCssVariables.spacing[2]} 0;
`;

const StyledLabel = styled.label`
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  flex-direction: column;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledInput = styled.input`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  outline: none;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};

  &:focus {
    border-color: ${themeCssVariables.border.color.medium};
  }
`;

const StyledButton = styled.button`
  background: ${themeCssVariables.background.invertedPrimary};
  border: none;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.inverted};
  cursor: pointer;
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
  padding: ${themeCssVariables.spacing[3]};
  transition: opacity 120ms ease;

  &:hover:not(:disabled) {
    opacity: 0.9;
  }
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const StyledToggleRow = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  font-size: ${themeCssVariables.font.size.sm};
  justify-content: center;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledToggleButton = styled.button`
  background: none;
  border: none;
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  padding: 0;
`;

const StyledError = styled.div`
  color: ${themeCssVariables.color.red};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledInfo = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
`;

type Mode = 'signin' | 'register';

export const MessengerSignInForm = () => {
  const { login, register } = useMessengerAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await login(email.trim(), password);
      } else {
        const res = await register(email.trim(), password, name.trim());
        setInfo(
          res.message ??
            'Account created. An administrator must approve it before you can sign in.',
        );
        setMode('signin');
        setPassword('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StyledWrapper>
      <StyledCard as="form" onSubmit={submit}>
        <div>
          <StyledTitle>
            {mode === 'signin' ? 'Sign in to Messages' : 'Create messenger account'}
          </StyledTitle>
          <StyledSubtitle>
            Use the same credentials as the Socorro team messenger (iOS / Expo Go).
          </StyledSubtitle>
        </div>
        {mode === 'register' ? (
          <StyledLabel>
            Full name
            <StyledInput
              autoComplete="name"
              onChange={(e) => setName(e.target.value)}
              required
              type="text"
              value={name}
            />
          </StyledLabel>
        ) : null}
        <StyledLabel>
          Email
          <StyledInput
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            required
            type="email"
            value={email}
          />
        </StyledLabel>
        <StyledLabel>
          Password
          <StyledInput
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            onChange={(e) => setPassword(e.target.value)}
            required
            type="password"
            value={password}
          />
        </StyledLabel>
        {error !== null ? <StyledError>{error}</StyledError> : null}
        {info !== null ? <StyledInfo>{info}</StyledInfo> : null}
        <StyledButton disabled={submitting} type="submit">
          {submitting
            ? mode === 'signin'
              ? 'Signing in…'
              : 'Creating account…'
            : mode === 'signin'
            ? 'Sign in'
            : 'Create account'}
        </StyledButton>
        <StyledToggleRow>
          {mode === 'signin' ? (
            <>
              <span>No account?</span>
              <StyledToggleButton
                onClick={() => {
                  setMode('register');
                  setError(null);
                  setInfo(null);
                }}
                type="button"
              >
                Register
              </StyledToggleButton>
            </>
          ) : (
            <>
              <span>Have an account?</span>
              <StyledToggleButton
                onClick={() => {
                  setMode('signin');
                  setError(null);
                  setInfo(null);
                }}
                type="button"
              >
                Sign in
              </StyledToggleButton>
            </>
          )}
        </StyledToggleRow>
      </StyledCard>
    </StyledWrapper>
  );
};
