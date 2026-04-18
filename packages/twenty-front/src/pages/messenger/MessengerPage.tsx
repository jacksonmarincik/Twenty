import { styled } from '@linaria/react';
import { useAtomValue } from 'jotai';
import { useEffect } from 'react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { MessengerLayout } from '@/messenger/components/MessengerLayout';
import { MessengerSignInForm } from '@/messenger/components/MessengerSignInForm';
import { useMessengerAuth } from '@/messenger/hooks/useMessengerAuth';
import { getMessengerSocket } from '@/messenger/services/messengerSocket';
import {
  messengerIsAuthenticatedState,
  messengerTokenState,
} from '@/messenger/states/messengerAuthState';

const StyledPage = styled.div`
  background: ${themeCssVariables.background.primary};
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
`;

export const MessengerPage = () => {
  const token = useAtomValue(messengerTokenState);
  const isAuthenticated = useAtomValue(messengerIsAuthenticatedState);
  const { refreshMe, logout } = useMessengerAuth();

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

  return (
    <StyledPage>
      {isAuthenticated ? <MessengerLayout /> : <MessengerSignInForm />}
    </StyledPage>
  );
};
