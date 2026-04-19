import { styled } from '@linaria/react';
import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { currentUserState } from '@/auth/states/currentUserState';
import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { tokenPairState } from '@/auth/states/tokenPairState';
import { MessengerLayout } from '@/messenger/components/MessengerLayout';
import { MessengerSignInForm } from '@/messenger/components/MessengerSignInForm';
import { useMessengerAuth } from '@/messenger/hooks/useMessengerAuth';
import { getMessengerSocket } from '@/messenger/services/messengerSocket';
import {
  messengerIsAuthenticatedState,
  messengerTokenState,
} from '@/messenger/states/messengerAuthState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

const StyledPage = styled.div`
  background: ${themeCssVariables.background.primary};
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
`;

const StyledCenter = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  flex: 1;
  font-size: ${themeCssVariables.font.size.sm};
  justify-content: center;
`;

export const MessengerPage = () => {
  const token = useAtomValue(messengerTokenState);
  const isAuthenticated = useAtomValue(messengerIsAuthenticatedState);
  const currentUser = useAtomStateValue(currentUserState);
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const tokenPair = useAtomStateValue(tokenPairState);
  const { refreshMe, logout, ssoLogin } = useMessengerAuth();

  // Track SSO lifecycle so we render a loader instead of the manual sign-in form
  // while we attempt transparent login via the Twenty session.
  const [ssoState, setSsoState] = useState<'idle' | 'pending' | 'failed' | 'done'>(
    'idle',
  );

  const twentyAccessToken = tokenPair?.accessOrWorkspaceAgnosticToken?.token ?? null;

  useEffect(() => {
    if (isAuthenticated) {
      setSsoState('done');
      return;
    }
    if (ssoState === 'pending' || ssoState === 'failed') return;
    const email = currentUser?.email ?? null;
    if (!email || !twentyAccessToken) return;

    const name = [
      currentWorkspaceMember?.name?.firstName,
      currentWorkspaceMember?.name?.lastName,
    ]
      .filter(
        (part): part is string => typeof part === 'string' && part.length > 0,
      )
      .join(' ');

    setSsoState('pending');
    void ssoLogin({ twentyAccessToken, email, name })
      .then(() => setSsoState('done'))
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.warn('Messenger SSO failed, falling back to manual sign-in', err);
        setSsoState('failed');
      });
  }, [
    isAuthenticated,
    ssoState,
    currentUser?.email,
    twentyAccessToken,
    currentWorkspaceMember?.name?.firstName,
    currentWorkspaceMember?.name?.lastName,
    ssoLogin,
  ]);

  useEffect(() => {
    if (token === null) return;
    const socket = getMessengerSocket(token);
    if (socket === null) return;
    const onConnectError = (err: Error) => {
      const msg = typeof err?.message === 'string' ? err.message : '';
      if (msg === 'Invalid token' || msg === 'Missing token') {
        logout();
      }
    };
    socket.on('connect_error', onConnectError);
    return () => {
      socket.off('connect_error', onConnectError);
    };
  }, [token, logout]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void refreshMe();
  }, [isAuthenticated, refreshMe]);

  const showSignInForm = !isAuthenticated && ssoState === 'failed';
  const showSsoPending =
    !isAuthenticated &&
    ssoState !== 'failed' &&
    currentUser?.email != null &&
    twentyAccessToken != null;

  return (
    <StyledPage>
      {isAuthenticated ? (
        <MessengerLayout />
      ) : showSsoPending ? (
        <StyledCenter>Loading messages…</StyledCenter>
      ) : showSignInForm ? (
        <MessengerSignInForm />
      ) : (
        // No Twenty session available yet - fall back to the manual form.
        <MessengerSignInForm />
      )}
    </StyledPage>
  );
};
