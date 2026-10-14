import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useColors } from '@/constants/theme';
import { useStrings } from '@/hooks/use-settings';

// The map tab shows the full-color app icon (round crop of assets/images/icon.png).
// renderingMode="original" keeps its colors instead of tinting it like a symbol.
const appLogo = require('@/assets/images/tab-logo.png');

export default function TabLayout() {
  const c = useColors();
  const t = useStrings();
  return (
    <NativeTabs tintColor={c.accent}>
      <NativeTabs.Trigger name="index" disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Icon src={appLogo} renderingMode="original" />
        <NativeTabs.Trigger.Label>{t.tabMap}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="nearby">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'location.circle', selected: 'location.circle.fill' }}
          md="near_me"
        />
        <NativeTabs.Trigger.Label>{t.tabNearby}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="add">
        <NativeTabs.Trigger.Icon sf={{ default: 'plus.circle', selected: 'plus.circle.fill' }} md="add_circle" />
        <NativeTabs.Trigger.Label>{t.tabAdd}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="account">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person.circle', selected: 'person.circle.fill' }}
          md="account_circle"
        />
        <NativeTabs.Trigger.Label>{t.tabAccount}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
