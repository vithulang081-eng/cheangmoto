import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as Updates from 'expo-updates';
import { type ReactNode } from 'react';
import { Pressable, ScrollView, Text, View, type ViewStyle } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { ICONS, Icon, type IconPair } from '@/components/icon';
import { type Language } from '@/constants/strings';
import { Brand, type Palette, Palettes, Radius, Spacing, useColors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import type { AuthUser } from '@/lib/auth';
import { THEMES, type ThemePreference, useSettings, useStrings } from '@/hooks/use-settings';
import { isDemoMode } from '@/lib/supabase';
import { confirm } from '@/utils/confirm';
import { formatPhone } from '@/utils/phone';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

const FLAGS: Record<Language, string> = { km: '🇰🇭', en: '🇬🇧' };
const LANGUAGE_NAMES: Record<Language, { native: string; hint: string }> = {
  km: { native: 'ខ្មែរ', hint: 'Khmer' },
  en: { native: 'English', hint: 'អង់គ្លេស' },
};

export function AccountScreen() {
  const c = useColors();
  const t = useStrings();
  const { user, isAdmin, signOut } = useAuth();

  if (user === undefined) return null;

  const confirmSignOut = () =>
    confirm({ title: t.signOutConfirm, confirmLabel: t.signOut, cancelLabel: t.cancel, destructive: true, onConfirm: signOut });

  const confirmSwitchAccount = () =>
    confirm({
      title: t.switchAccount,
      message: t.switchAccountConfirm,
      confirmLabel: t.continue,
      cancelLabel: t.cancel,
      onConfirm: async () => {
        await signOut();
        router.push('/sign-in');
      },
    });

  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.xl, paddingBottom: Spacing.xxl * 2 }}>
      <ProfileHeader user={user} />

      <Section title={t.appearance}>
        <ThemePicker />
      </Section>

      <Section title={t.language}>
        <LanguagePicker />
      </Section>

      <Section title={t.general}>
        <PressableRow icon={ICONS.scan} label={t.scanQr} onPress={() => router.push('/scan')} />
        <VersionRows />
      </Section>

      {user && (
        <Section title={t.accountTitle}>
          {isAdmin && <PressableRow icon={ICONS.check} label={t.adminRow} detail={t.adminRowBody} onPress={() => router.push('/admin')} />}
          <PressableRow icon={ICONS.edit} label={t.editProfile} onPress={() => router.push('/edit-profile')} />
          <PressableRow icon={ICONS.switchAccount} label={t.switchAccount} onPress={confirmSwitchAccount} />
          <PressableRow icon={ICONS.signOut} label={t.signOut} tone="danger" onPress={confirmSignOut} last />
        </Section>
      )}

      <Text style={{ fontSize: 12, lineHeight: 18, color: c.tertiaryLabel, textAlign: 'center', paddingHorizontal: Spacing.xl }}>
        {t.aboutBody}
      </Text>
    </ScrollView>
  );
}

/* ---------- header: photo, name, number ---------- */

function ProfileHeader({ user }: { user: AuthUser | null }) {
  const c = useColors();
  const t = useStrings();
  const openEditor = () => router.push('/edit-profile');

  return (
    <View style={{ alignItems: 'center', gap: Spacing.md, paddingTop: Spacing.sm }}>
      <Pressable
        onPress={user ? openEditor : undefined}
        disabled={!user}
        accessibilityRole={user ? 'button' : undefined}
        accessibilityLabel={t.editProfile}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
        <View
          style={{
            width: 104,
            height: 104,
            borderRadius: 52,
            overflow: 'hidden',
            backgroundColor: c.accentSoft,
            borderWidth: 3,
            borderColor: c.card,
          }}>
          <Image
            source={user?.avatarUrl ? { uri: user.avatarUrl } : require('@/assets/images/icon.png')}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={150}
            accessibilityIgnoresInvertColors
          />
        </View>
        {user && (
          <View
            style={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              width: 32,
              height: 32,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: c.accent,
              borderWidth: 3,
              borderColor: c.background,
            }}>
            <Icon {...ICONS.camera} size={14} color={c.onFill} />
          </View>
        )}
      </Pressable>

      {user ? (
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Text numberOfLines={1} style={{ fontSize: 24, fontWeight: '800', color: c.label, textAlign: 'center' }}>
            {user.name ?? formatPhone(user.phone)}
          </Text>
          {user.name ? (
            <Text selectable style={{ fontSize: 15, color: c.secondaryLabel, fontVariant: ['tabular-nums'] }}>
              {formatPhone(user.phone)}
            </Text>
          ) : (
            <Pressable onPress={openEditor} accessibilityRole="button" hitSlop={6}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: c.accent }}>+ {t.noNameYet}</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <View style={{ alignItems: 'center', gap: Spacing.md, alignSelf: 'stretch' }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: c.label, textAlign: 'center' }}>{t.accountGuest}</Text>
          <Text style={{ fontSize: 15, lineHeight: 22, color: c.secondaryLabel, textAlign: 'center', paddingHorizontal: Spacing.lg }}>
            {t.accountGuestBody}
          </Text>
          <ActionButton
            size="large"
            variant="primary"
            icon={ICONS.phone}
            label={t.signInWithPhone}
            onPress={() => router.push('/sign-in')}
            style={{ alignSelf: 'stretch', marginTop: Spacing.xs }}
          />
        </View>
      )}

      {(isExpoGo || isDemoMode) && (
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {isExpoGo && <Pill label={t.expoGo} />}
          {isDemoMode && <Pill label={t.demoData} />}
        </View>
      )}
    </View>
  );
}

function Pill({ label }: { label: string }) {
  const c = useColors();
  return (
    <View style={{ paddingHorizontal: 9, paddingVertical: 3, borderRadius: Radius.pill, backgroundColor: c.fill }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: c.secondaryLabel, letterSpacing: 0.3 }}>{label}</Text>
    </View>
  );
}

/* ---------- theme picker: tap a small phone preview ---------- */

const PREVIEW_W = 62;

function ThemePicker() {
  const t = useStrings();
  const { theme, setTheme } = useSettings();
  const labels: Record<ThemePreference, string> = { system: t.themeSystem, light: t.themeLight, dark: t.themeDark };
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', paddingVertical: Spacing.lg }}>
      {THEMES.map((id) => (
        <PhonePreview key={id} scheme={id} label={labels[id]} selected={theme === id} onPress={() => setTheme(id)} />
      ))}
    </View>
  );
}

function PhonePreview({
  scheme,
  label,
  selected,
  onPress,
}: {
  scheme: ThemePreference;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected, checked: selected }}
      hitSlop={6}
      style={({ pressed }) => ({ alignItems: 'center', gap: Spacing.sm, opacity: pressed ? 0.85 : 1 })}>
      <View
        style={{
          width: PREVIEW_W + 8,
          height: PREVIEW_W * 2 + 8,
          padding: 4,
          borderRadius: 16,
          borderCurve: 'continuous',
          backgroundColor: selected ? c.accent : c.fill,
        }}>
        <View style={{ flex: 1, borderRadius: 12, borderCurve: 'continuous', overflow: 'hidden', backgroundColor: Brand.deepNavy }}>
          {scheme === 'system' ? (
            <>
              <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '50%', overflow: 'hidden' }}>
                <MiniScreen p={Palettes.light} style={{ width: '200%' }} />
              </View>
              <View style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '50%', overflow: 'hidden' }}>
                <MiniScreen p={Palettes.dark} style={{ width: '200%', left: '-100%' }} />
              </View>
            </>
          ) : (
            <MiniScreen p={Palettes[scheme]} />
          )}
        </View>
        {selected && <CheckBadge />}
      </View>
      <Text style={{ fontSize: 13, fontWeight: selected ? '800' : '600', color: selected ? c.accent : c.secondaryLabel }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** A tiny, simplified Map tab in a palette: notch, title, map, one card with the red call button. */
function MiniScreen({ p, style }: { p: Palette; style?: ViewStyle }) {
  return (
    <View style={[{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: p.background, padding: 6, gap: 5 }, style]}>
      <View style={{ alignSelf: 'center', width: 16, height: 3, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.5)' }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: p.accent }} />
        <View style={{ width: 20, height: 4, borderRadius: 2, backgroundColor: p.label }} />
      </View>
      <View style={{ flex: 1, borderRadius: 5, backgroundColor: p.accentSoft }}>
        <View style={{ position: 'absolute', top: 8, left: 9, width: 5, height: 5, borderRadius: 3, backgroundColor: p.primary }} />
        <View style={{ position: 'absolute', top: 20, right: 9, width: 5, height: 5, borderRadius: 3, backgroundColor: p.primary }} />
        <View style={{ position: 'absolute', bottom: 8, left: 20, width: 6, height: 6, borderRadius: 3, backgroundColor: p.accent }} />
      </View>
      <View style={{ padding: 4, gap: 3, borderRadius: 5, backgroundColor: p.card, borderWidth: 1, borderColor: p.border }}>
        <View style={{ width: '65%', height: 3, borderRadius: 2, backgroundColor: p.label }} />
        <View style={{ height: 6, borderRadius: 3, backgroundColor: p.primary }} />
      </View>
    </View>
  );
}

/* ---------- language picker: compact flag pills ---------- */

function LanguagePicker() {
  const { language, setLanguage } = useSettings();
  return (
    <View style={{ flexDirection: 'row', gap: Spacing.sm, paddingVertical: Spacing.lg }}>
      {(Object.keys(FLAGS) as Language[]).map((id) => (
        <FlagSticker key={id} id={id} selected={language === id} onPress={() => setLanguage(id)} />
      ))}
    </View>
  );
}

function FlagSticker({ id, selected, onPress }: { id: Language; selected: boolean; onPress: () => void }) {
  const c = useColors();
  const name = LANGUAGE_NAMES[id];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={`${name.native} (${name.hint})`}
      accessibilityState={{ selected, checked: selected }}
      style={({ pressed }) => ({
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        minHeight: 50,
        paddingHorizontal: Spacing.md,
        borderRadius: Radius.md,
        borderCurve: 'continuous',
        backgroundColor: selected ? c.accentSoft : c.fill,
        borderWidth: 1.5,
        borderColor: selected ? c.accent : 'transparent',
        opacity: pressed ? 0.85 : 1,
      })}>
      <Text style={{ fontSize: 22, lineHeight: 28 }}>{FLAGS[id]}</Text>
      <Text numberOfLines={1} style={{ flex: 1, fontSize: 15, fontWeight: '700', color: selected ? c.accent : c.label }}>
        {name.native}
      </Text>
      {selected && <Icon {...ICONS.checkmark} size={14} color={c.accent} />}
    </Pressable>
  );
}

function CheckBadge() {
  const c = useColors();
  return (
    <View
      style={{
        position: 'absolute',
        top: -7,
        right: -7,
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: c.accent,
        borderWidth: 2,
        borderColor: c.card,
      }}>
      <Icon {...ICONS.checkmark} size={10} color={c.onFill} />
    </View>
  );
}

/* ---------- about ---------- */

function VersionRows() {
  const c = useColors();
  const t = useStrings();
  const { language } = useSettings();
  const updatedAt = Updates.createdAt
    ? Updates.createdAt.toLocaleDateString(language === 'km' ? 'km-KH' : 'en-GB', { dateStyle: 'medium' })
    : null;

  return (
    <>
      <Row icon={ICONS.info} label={t.version} last={!updatedAt}>
        <Text selectable style={{ fontSize: 15, color: c.secondaryLabel, fontVariant: ['tabular-nums'] }}>
          {APP_VERSION}
        </Text>
      </Row>
      {updatedAt && (
        <Row icon={ICONS.clock} label={t.lastUpdate} last>
          <Text style={{ fontSize: 15, color: c.secondaryLabel }}>{updatedAt}</Text>
        </Row>
      )}
    </>
  );
}

/* ---------- building blocks ---------- */

function Section({ title, children }: { title: string; children: ReactNode }) {
  const c = useColors();
  return (
    <View style={{ gap: Spacing.sm }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: c.secondaryLabel, paddingHorizontal: Spacing.sm }}>{title}</Text>
      <View
        style={{
          paddingHorizontal: Spacing.lg,
          borderRadius: Radius.lg,
          borderCurve: 'continuous',
          backgroundColor: c.card,
          borderWidth: 1,
          borderColor: c.border,
        }}>
        {children}
      </View>
    </View>
  );
}

/** Tinted rounded square behind a row icon, like iOS Settings. */
function IconTile({ icon, tone = 'default' }: { icon: IconPair; tone?: 'default' | 'danger' | 'muted' }) {
  const c = useColors();
  const bg = { default: c.accentSoft, danger: 'rgba(227, 30, 50, 0.12)', muted: c.fill }[tone];
  const fg = { default: c.accent, danger: c.danger, muted: c.secondaryLabel }[tone];
  return (
    <View
      style={{
        width: 34,
        height: 34,
        borderRadius: 10,
        borderCurve: 'continuous',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bg,
      }}>
      <Icon {...icon} size={18} color={fg} />
    </View>
  );
}

function Row({ icon, label, children, last = false }: { icon: IconPair; label: string; children: ReactNode; last?: boolean }) {
  const c = useColors();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        minHeight: 52,
        paddingVertical: 8,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: c.border,
      }}>
      <IconTile icon={icon} tone="muted" />
      <Text style={{ flex: 1, fontSize: 16, fontWeight: '600', color: c.label }}>{label}</Text>
      {children}
    </View>
  );
}

type PressableRowProps = {
  icon: IconPair;
  label: string;
  detail?: string;
  tone?: 'default' | 'danger';
  onPress: () => void;
  disabled?: boolean;
  trailing?: ReactNode;
  last?: boolean;
};

function PressableRow({ icon, label, detail, tone = 'default', onPress, disabled = false, trailing, last = false }: PressableRowProps) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        minHeight: 52,
        paddingVertical: 8,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: c.border,
        opacity: disabled ? 0.5 : pressed ? 0.6 : 1,
      })}>
      <IconTile icon={icon} tone={tone} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: tone === 'danger' ? c.danger : c.label }}>{label}</Text>
        {detail && <Text style={{ fontSize: 13, color: c.secondaryLabel }}>{detail}</Text>}
      </View>
      {trailing ?? (tone === 'default' && <Icon {...ICONS.chevron} size={14} color={c.tertiaryLabel} />)}
    </Pressable>
  );
}
