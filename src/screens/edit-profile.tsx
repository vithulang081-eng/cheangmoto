import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { ICONS, Icon, type IconPair } from '@/components/icon';
import { Radius, Spacing, useColors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useStrings } from '@/hooks/use-settings';
import { updateProfile } from '@/lib/auth';
import { AVATAR_BUCKET, uploadPhoto } from '@/lib/photos';
import { formatPhone } from '@/utils/phone';

const NAME_MAX = 40;

/** Name + profile photo. Photo is cropped square on pick and uploaded on save. */
export function EditProfileScreen() {
  const c = useColors();
  const t = useStrings();
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  // null = keep current, '' = removed, other = new local URI
  const [photo, setPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const shownPhoto = photo === null ? user.avatarUrl : photo || null;
  const isDirty = name.trim() !== (user.name ?? '') || photo !== null;

  const pick = async (source: 'library' | 'camera') => {
    setError(null);
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(t.errPhotoPermission);
      return;
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8, exif: false };
    const result =
      source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (!result.canceled && result.assets[0]) setPhoto(result.assets[0].uri);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      let avatarUrl = user.avatarUrl;
      if (photo === '') avatarUrl = null;
      else if (photo) avatarUrl = await uploadPhoto(photo, user.id, AVATAR_BUCKET);
      const updated = await updateProfile(user, { name, avatarUrl });
      setUser(updated);
      router.back();
    } catch {
      setError(t.errProfileSave);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      contentContainerStyle={{ padding: Spacing.xl, gap: Spacing.xl, paddingBottom: Spacing.xxl * 2 }}>
      {/* Photo */}
      <View style={{ alignItems: 'center', gap: Spacing.lg }}>
        <Pressable
          onPress={() => pick('library')}
          accessibilityRole="button"
          accessibilityLabel={t.choosePhoto}
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
          <View
            style={{
              width: 132,
              height: 132,
              borderRadius: 66,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: c.accentSoft,
              borderWidth: 4,
              borderColor: c.card,
              boxShadow: `0 8px 24px ${c.shadow}`,
            }}>
            {shownPhoto ? (
              <Image source={{ uri: shownPhoto }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={150} />
            ) : (
              <Icon {...ICONS.person} size={72} color={c.accent} />
            )}
          </View>
          <View
            style={{
              position: 'absolute',
              right: 0,
              bottom: 2,
              width: 38,
              height: 38,
              borderRadius: 19,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: c.primary,
              borderWidth: 3,
              borderColor: c.background,
            }}>
            <Icon {...ICONS.camera} size={17} color={c.onFill} />
          </View>
        </Pressable>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.sm }}>
          <SmallButton icon={ICONS.photo} label={t.choosePhoto} onPress={() => pick('library')} />
          {process.env.EXPO_OS !== 'web' && <SmallButton icon={ICONS.camera} label={t.takePhoto} onPress={() => pick('camera')} />}
          {shownPhoto && <SmallButton icon={ICONS.trash} label={t.removePhoto} tone="danger" onPress={() => setPhoto('')} />}
        </View>
      </View>

      {/* Name */}
      <View style={{ gap: Spacing.sm }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: c.secondaryLabel, paddingHorizontal: Spacing.xs }}>{t.displayName}</Text>
        <TextInput
          value={name}
          onChangeText={(value) => {
            setName(value);
            setError(null);
          }}
          placeholder={t.displayNamePlaceholder}
          placeholderTextColor={c.tertiaryLabel}
          selectionColor={c.accent}
          maxLength={NAME_MAX}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={() => isDirty && !saving && save()}
          accessibilityLabel={t.displayName}
          style={{
            minHeight: 54,
            paddingHorizontal: Spacing.lg,
            borderRadius: Radius.md,
            borderCurve: 'continuous',
            backgroundColor: c.card,
            borderWidth: 1.5,
            borderColor: c.border,
            fontSize: 18,
            fontWeight: '600',
            color: c.label,
          }}
        />
        <Text style={{ fontSize: 12, color: c.tertiaryLabel, textAlign: 'right', paddingHorizontal: Spacing.xs, fontVariant: ['tabular-nums'] }}>
          {name.length}/{NAME_MAX}
        </Text>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.md,
          padding: Spacing.lg,
          borderRadius: Radius.lg,
          borderCurve: 'continuous',
          backgroundColor: c.card,
          borderWidth: 1,
          borderColor: c.border,
        }}>
        <Icon {...ICONS.phone} size={18} color={c.tertiaryLabel} />
        <Text style={{ flex: 1, fontSize: 15, color: c.secondaryLabel }}>{t.phone}</Text>
        <Text selectable style={{ fontSize: 15, fontWeight: '700', color: c.label, fontVariant: ['tabular-nums'] }}>
          {formatPhone(user.phone)}
        </Text>
      </View>

      <View style={{ gap: Spacing.sm }}>
        {error && <Text style={{ color: c.danger, fontSize: 14, textAlign: 'center' }}>{error}</Text>}
        <ActionButton
          size="large"
          variant="primary"
          icon={ICONS.check}
          label={saving ? t.saving : t.saveChanges}
          loading={saving}
          disabled={!isDirty}
          onPress={save}
        />
      </View>
    </ScrollView>
  );
}

function SmallButton({ icon, label, onPress, tone = 'default' }: { icon: IconPair; label: string; onPress: () => void; tone?: 'default' | 'danger' }) {
  const c = useColors();
  const color = tone === 'danger' ? c.danger : c.accent;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        minHeight: 38,
        paddingHorizontal: 14,
        borderRadius: Radius.pill,
        backgroundColor: tone === 'danger' ? 'rgba(227, 30, 50, 0.10)' : c.accentSoft,
        opacity: pressed ? 0.7 : 1,
      })}>
      <Icon {...icon} size={15} color={color} />
      <Text style={{ fontSize: 14, fontWeight: '700', color }}>{label}</Text>
    </Pressable>
  );
}
