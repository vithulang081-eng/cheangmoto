import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { ICONS } from '@/components/icon';
import { Spacing, useColors } from '@/constants/theme';
import { useStrings } from '@/hooks/use-settings';

type Props = { title: string; body: string };

/** Friendly gate shown where an account is needed (adding a mechanic, account tab). */
export function SignInPrompt({ title, body }: Props) {
  const c = useColors();
  const t = useStrings();
  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: Spacing.xl, gap: Spacing.xl }}>
      <View style={{ alignItems: 'center', gap: Spacing.md }}>
        <Image
          source={require('@/assets/images/icon.png')}
          style={{ width: 112, height: 112, borderRadius: 56 }}
          accessibilityIgnoresInvertColors
        />
        <Text style={{ fontSize: 22, fontWeight: '800', color: c.label, textAlign: 'center' }}>{title}</Text>
        <Text style={{ fontSize: 15, color: c.secondaryLabel, textAlign: 'center' }}>{body}</Text>
      </View>
      <ActionButton
        size="large"
        variant="primary"
        icon={ICONS.phone}
        label={t.signInWithPhone}
        onPress={() => router.push('/sign-in')}
      />
    </ScrollView>
  );
}
