import { useLocation } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';
import { IconMessage } from 'twenty-ui/display';

import { NavigationDrawerItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItem';
import { NavigationDrawerSection } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSection';

export const NavigationDrawerMessengerSection = () => {
  const location = useLocation();
  const active =
    location.pathname === AppPath.MessengerPage ||
    location.pathname.startsWith(`${AppPath.MessengerPage}/`);

  return (
    <NavigationDrawerSection>
      <NavigationDrawerItem
        active={active}
        Icon={IconMessage}
        label="Messages"
        to={AppPath.MessengerPage}
      />
    </NavigationDrawerSection>
  );
};
