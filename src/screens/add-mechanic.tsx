import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';

import { ActionButton } from '@/components/action-button';
import { Chip } from '@/components/chip';
import { ICONS } from '@/components/icon';
import { LocationPicker } from '@/components/location-picker';
import { PhotoSlot } from '@/components/photo-slot';
import { SERVICE_IDS, type ServiceId, serviceLabel } from '@/constants/services';
import { Radius, Spacing, useColors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useStrings } from '@/hooks/use-settings';
import { useUserLocation } from '@/hooks/use-user-location';
import { requestLocationPick } from '@/lib/location-pick';
import { type DuplicateMatch, findDuplicateMechanic, type Mechanic, submitMechanic, updateMyMechanic } from '@/lib/mechanics';
import { MAX_GALLERY_PHOTOS, pickPhotos, takePhoto, uploadPhoto } from '@/lib/photos';
import { isDemoMode } from '@/lib/supabase';
import { type Coords, isInCambodia } from '@/utils/geo';
import { formatCoords, reverseGeocode } from '@/utils/geocode';
import { parseTime } from '@/utils/opening-hours';
import { isValidPhone } from '@/utils/phone';

type Errors = Partial<Record<'name' | 'phone' | 'services' | 'hours' | 'location', string>>;

const EMPTY_FORM = {
  name: '',
  phone: '',
  address: '',
  services: [] as ServiceId[],
  open24h: false,
  opensAt: '07:00',
  closesAt: '18:00',
};

type FormState = typeof EMPTY_FORM;

function formFromMechanic(m: Mechanic): FormState {
  return {
    name: m.name,
    phone: m.phone,
    address: m.address ?? '',
    services: m.services.filter((s): s is ServiceId => (SERVICE_IDS as readonly string[]).includes(s)),
    open24h: m.open_24h,
    opensAt: m.opens_at?.slice(0, 5) ?? '07:00',
    closesAt: m.closes_at?.slice(0, 5) ?? '18:00',
  };
}

const isLocalUri = (uri: string) => !/^https?:\/\//.test(uri);

/**
 * Add a shop (anyone can fill it in; sign-in is asked only when sending)
 * or, with `editing`, change a shop the signed-in mechanic owns.
 */
export function AddMechanicScreen({ editing }: { editing?: Mechanic }) {
  const { user } = useAuth();
  return <AddMechanicForm key={editing?.id ?? 'new'} userId={user?.id ?? null} editing={editing} />;
}

function AddMechanicForm({ userId, editing }: { userId: string | null; editing?: Mechanic }) {
  const c = useColors();
  const t = useStrings();
  const location = useUserLocation();
  const isEditing = !!editing;
  const [form, setForm] = useState<FormState>(() => (editing ? formFromMechanic(editing) : EMPTY_FORM));
  const [isOwner, setIsOwner] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(editing?.photo_url ?? null);
  const [gallery, setGallery] = useState<string[]>(editing?.photos ?? []);
  const [uploading, setUploading] = useState(false);
  // null = follow the rider's GPS until they choose a point themselves.
  const [pickedCoords, setPickedCoords] = useState<Coords | null>(
    editing ? { latitude: editing.latitude, longitude: editing.longitude } : null
  );
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [addressAutoFilled, setAddressAutoFilled] = useState(false);

  const coords = pickedCoords ?? location.coords;
  const update = (patch: Partial<typeof EMPTY_FORM>) => setForm((f) => ({ ...f, ...patch }));

  /** Full-screen map → exact point; then suggest an address if the field is still empty. */
  const chooseOnMap = async () => {
    const picked = await requestLocationPick(coords);
    if (!picked) return;
    setPickedCoords(picked);
    if (form.address.trim() === '') {
      const suggestion = await reverseGeocode(picked);
      if (suggestion) {
        update({ address: suggestion });
        setAddressAutoFilled(true);
      }
    }
  };

  const toggleService = (id: ServiceId) =>
    update({
      services: form.services.includes(id)
        ? form.services.filter((s) => s !== id)
        : [...form.services, id],
    });

  /** Camera or library? Resolves with the picked local URIs ([] when cancelled). */
  const choosePhotoSource = (limit: number) =>
    new Promise<string[]>((resolve) => {
      Alert.alert(
        t.addPhoto,
        undefined,
        [
          {
            text: t.takePhoto,
            onPress: async () => {
              const uri = await takePhoto();
              resolve(uri ? [uri] : []);
            },
          },
          { text: t.choosePhoto, onPress: async () => resolve(await pickPhotos(limit)) },
          { text: t.cancel, style: 'cancel', onPress: () => resolve([]) },
        ],
        { cancelable: true, onDismiss: () => resolve([]) }
      );
    });

  const addProfilePhoto = async () => {
    const [uri] = await choosePhotoSource(1);
    if (uri) setProfilePhoto(uri);
  };

  const addGalleryPhotos = async () => {
    const uris = await choosePhotoSource(MAX_GALLERY_PHOTOS - gallery.length);
    if (uris.length) setGallery((g) => [...g, ...uris].slice(0, MAX_GALLERY_PHOTOS));
  };

  const validate = (): Errors => {
    const next: Errors = {};
    if (form.name.trim().length < 2) next.name = t.errNameRequired;
    if (!isValidPhone(form.phone)) next.phone = t.errPhoneInvalid;
    if (form.services.length === 0) next.services = t.errServiceRequired;
    if (!form.open24h && (parseTime(form.opensAt) == null || parseTime(form.closesAt) == null)) {
      next.hours = t.errHoursInvalid;
    }
    if (!isInCambodia(coords)) next.location = t.errOutsideCambodia;
    return next;
  };

  /** Same phone or same spot as an existing shop: say who has it and offer the right next step. */
  const showDuplicate = (dup: DuplicateMatch) => {
    const what = dup.same_phone ? t.dupSamePhone(dup.name) : t.dupSameLocation(dup.name);
    const who = dup.is_mine
      ? t.dupOwnedByMe
      : dup.has_owner
        ? t.dupOwnedByOther
        : dup.status === 'pending'
          ? t.dupPending
          : '';
    const buttons: { text: string; style?: 'cancel'; onPress?: () => void }[] = [{ text: t.close, style: 'cancel' }];
    if (dup.is_mine) {
      buttons.push({ text: t.editMyShop, onPress: () => router.push({ pathname: '/edit/[id]', params: { id: dup.id } }) });
    } else if (dup.status === 'approved') {
      buttons.push({ text: t.viewShop, onPress: () => router.push({ pathname: '/mechanic/[id]', params: { id: dup.id } }) });
    }
    Alert.alert(t.dupTitle, [what, who].filter(Boolean).join('\n\n'), buttons);
  };

  const onSubmit = async () => {
    const found = validate();
    setErrors(found);
    setSubmitError(null);
    if (Object.keys(found).length > 0) return;

    // The draft stays in the form while they sign in; they come back and tap send again.
    if (!userId) {
      Alert.alert(t.signInToSubmitTitle, t.signInToSubmitBody, [
        { text: t.cancel, style: 'cancel' },
        { text: t.signIn, onPress: () => router.push('/sign-in') },
      ]);
      return;
    }

    setSubmitting(true);
    try {
      const duplicate = await findDuplicateMechanic(form.phone, coords, editing?.id).catch(() => null);
      if (duplicate) {
        showDuplicate(duplicate);
        return;
      }

      // Photos go to Storage first; the shop row then only stores their public URLs.
      let photo_url: string | null = profilePhoto;
      let photos: string[] = gallery;
      const needsUpload = (profilePhoto && isLocalUri(profilePhoto)) || gallery.some(isLocalUri);
      if (needsUpload) {
        setUploading(true);
        try {
          photo_url = profilePhoto && isLocalUri(profilePhoto) ? await uploadPhoto(profilePhoto, userId) : profilePhoto;
          photos = await Promise.all(gallery.map((uri) => (isLocalUri(uri) ? uploadPhoto(uri, userId) : uri)));
        } catch {
          setSubmitError(t.errPhotoUpload);
          return;
        } finally {
          setUploading(false);
        }
      }

      const payload = {
        ...coords,
        name: form.name.trim(),
        phone: form.phone,
        address: form.address.trim(),
        services: form.services,
        open_24h: form.open24h,
        opens_at: form.open24h ? null : form.opensAt,
        closes_at: form.open24h ? null : form.closesAt,
        photo_url,
        photos,
      };

      if (editing) {
        await updateMyMechanic(editing.id, payload);
        Alert.alert(t.savedTitle, t.savedBody, [{ text: t.close, onPress: () => router.back() }]);
        return;
      }

      await submitMechanic({ ...payload, is_owner: isOwner });
      // Only clear the form once the save succeeded, so a failed send keeps the draft.
      setForm(EMPTY_FORM);
      setPickedCoords(null);
      setAddressAutoFilled(false);
      setProfilePhoto(null);
      setGallery([]);
      setIsOwner(false);
      Alert.alert(t.thanksTitle, isDemoMode ? t.thanksBodyDemo : t.thanksBody);
    } catch {
      setSubmitError(t.errSubmitFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      automaticallyAdjustKeyboardInsets
      contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.xl, paddingBottom: Spacing.xxl * 2 }}>
      <Section title={t.sectionShop}>
        <Field label={t.shopName} error={errors.name}>
          <Input
            value={form.name}
            onChangeText={(name) => update({ name })}
            placeholder={t.shopNamePlaceholder}
            maxLength={80}
            returnKeyType="next"
          />
        </Field>
        <Field label={t.phone} error={errors.phone}>
          <Input
            value={form.phone}
            onChangeText={(phone) => update({ phone })}
            placeholder={t.phonePlaceholder}
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            maxLength={16}
          />
        </Field>
        <Field label={t.address}>
          <Input
            value={form.address}
            onChangeText={(address) => update({ address })}
            placeholder={t.addressPlaceholder}
            maxLength={160}
          />
        </Field>
      </Section>

      <Section title={t.sectionPhotos}>
        <Field label={t.profilePhoto}>
          <Text style={{ fontSize: 13, color: c.secondaryLabel }}>{t.profilePhotoHint}</Text>
          <View style={{ flexDirection: 'row' }}>
            <PhotoSlot uri={profilePhoto} size={104} round onAdd={addProfilePhoto} onRemove={() => setProfilePhoto(null)} />
          </View>
        </Field>
        <Field label={t.galleryPhotos}>
          <Text style={{ fontSize: 13, color: c.secondaryLabel }}>{t.galleryPhotosHint}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
            {gallery.map((uri, index) => (
              <PhotoSlot key={uri} uri={uri} size={96} onRemove={() => setGallery((g) => g.filter((_, i) => i !== index))} />
            ))}
            {gallery.length < MAX_GALLERY_PHOTOS && <PhotoSlot size={96} onAdd={addGalleryPhotos} />}
          </View>
        </Field>
      </Section>

      <Section title={t.services} error={errors.services}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
          {SERVICE_IDS.map((id) => (
            <Chip
              key={id}
              label={serviceLabel(id, t)}
              selected={form.services.includes(id)}
              onPress={() => toggleService(id)}
            />
          ))}
        </View>
      </Section>

      <Section title={t.hours} error={errors.hours}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: c.label }}>{t.open24h}</Text>
          <Switch
            value={form.open24h}
            onValueChange={(open24h) => update({ open24h })}
            trackColor={{ true: c.accent }}
          />
        </View>
        {!form.open24h && (
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <View style={{ flex: 1 }}>
              <Field label={t.opensAt}>
                <Input
                  value={form.opensAt}
                  onChangeText={(opensAt) => update({ opensAt })}
                  placeholder="07:00"
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label={t.closesAt}>
                <Input
                  value={form.closesAt}
                  onChangeText={(closesAt) => update({ closesAt })}
                  placeholder="18:00"
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </Field>
            </View>
          </View>
        )}
      </Section>

      <Section title={t.shopLocation} error={errors.location}>
        <Text style={{ fontSize: 14, color: c.secondaryLabel }}>{t.locationHint}</Text>
        <LocationPicker value={coords} chosen={pickedCoords !== null} onPressChoose={chooseOnMap} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: c.secondaryLabel }}>{t.coordinates}</Text>
            <Text selectable style={{ fontSize: 15, fontWeight: '700', color: c.label, fontVariant: ['tabular-nums'] }}>
              {formatCoords(coords)}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              setPickedCoords(null);
              location.refresh();
            }}
            accessibilityRole="button"
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: c.accent }}>{t.useMyLocation}</Text>
          </Pressable>
        </View>
        {addressAutoFilled && <Text style={{ fontSize: 13, color: c.tertiaryLabel }}>{t.addressAutoFilled}</Text>}
      </Section>

      {!isEditing && (
        <Section title={t.iAmOwner}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
            <Text style={{ flex: 1, fontSize: 14, color: c.secondaryLabel }}>{t.iAmOwnerHint}</Text>
            <Switch value={isOwner} onValueChange={setIsOwner} trackColor={{ true: c.accent }} />
          </View>
        </Section>
      )}

      <View style={{ gap: Spacing.sm }}>
        {submitError && (
          <Text selectable style={{ color: c.danger, fontSize: 14, textAlign: 'center' }}>
            {submitError}
          </Text>
        )}
        <ActionButton
          size="large"
          variant="primary"
          icon={isEditing ? ICONS.checkmark : ICONS.add}
          label={uploading ? t.uploadingPhotos : isEditing ? (submitting ? t.saving : t.save) : submitting ? t.submitting : t.submit}
          loading={submitting}
          onPress={onSubmit}
        />
        {!userId && <Text style={{ fontSize: 13, color: c.tertiaryLabel, textAlign: 'center' }}>{t.signInToSubmitBody}</Text>}
      </View>
    </ScrollView>
  );
}

/** Grouped card with its title above it, iOS-settings style. */
function Section({ title, error, children }: { title: string; error?: string; children: React.ReactNode }) {
  const c = useColors();
  return (
    <View style={{ gap: Spacing.sm }}>
      <Text style={{ fontSize: 14, fontWeight: '700', color: c.secondaryLabel, paddingHorizontal: Spacing.xs }}>
        {title}
      </Text>
      <View
        style={{
          gap: Spacing.lg,
          padding: Spacing.lg,
          borderRadius: Radius.lg,
          borderCurve: 'continuous',
          backgroundColor: c.card,
          borderWidth: 1,
          borderColor: error ? c.danger : c.border,
        }}>
        {children}
      </View>
      {error && <Text style={{ fontSize: 13, color: c.danger, paddingHorizontal: Spacing.xs }}>{error}</Text>}
    </View>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  const c = useColors();
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: c.secondaryLabel }}>{label}</Text>
      {children}
      {error && <Text style={{ fontSize: 13, color: c.danger }}>{error}</Text>}
    </View>
  );
}

function Input(props: TextInputProps) {
  const c = useColors();
  return (
    <TextInput
      placeholderTextColor={c.tertiaryLabel}
      selectionColor={c.accent}
      {...props}
      style={{
        minHeight: 48,
        paddingHorizontal: Spacing.md,
        borderRadius: Radius.sm,
        borderCurve: 'continuous',
        backgroundColor: c.fill,
        fontSize: 16,
        color: c.label,
      }}
    />
  );
}
