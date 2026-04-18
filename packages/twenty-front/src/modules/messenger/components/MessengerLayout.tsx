import { styled } from '@linaria/react';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { MessengerConversationView } from '@/messenger/components/MessengerConversationView';
import { MessengerSidebar } from '@/messenger/components/MessengerSidebar';
import { messengerUserState } from '@/messenger/states/messengerAuthState';
import { MessengerConversationRef } from '@/messenger/types/messenger.types';

const StyledLayout = styled.div`
  background: ${themeCssVariables.background.primary};
  display: flex;
  flex: 1;
  height: 100%;
  min-height: 0;
`;

export const MessengerLayout = () => {
  const currentUser = useAtomValue(messengerUserState);
  const [selected, setSelected] = useState<MessengerConversationRef | null>(
    null,
  );

  return (
    <StyledLayout>
      <MessengerSidebar
        currentUserId={currentUser?.id ?? null}
        onSelect={setSelected}
        selected={selected}
      />
      <MessengerConversationView
        currentUserId={currentUser?.id ?? null}
        selected={selected}
      />
    </StyledLayout>
  );
};
