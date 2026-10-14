import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { ICONS } from '@/components/icon';
import { Radius, Spacing, useColors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useStrings } from '@/hooks/use-settings';
import { DEMO_OTP, OTP_LENGTH, RESEND_SECONDS, sendOtp, verifyOtp } from '@/lib/auth';
import { isDemoMode } from '@/lib/supabase';
import { formatPhone, isValidPhone, normalizePhone } from '@/utils/phone';

import { OtpInput } from './otp-input';

type Step = { name: 'phone' } | { name: 'code'; phone: string; sentAt: number };

export function SignInScreen() {
  const [step, setStep] = useState<Step>({ name: 'phone' });
  return step.name === 'phone' ? (
    <PhoneStep onSent={(phone) => setStep({ name: 'code', phone, sentAt: Date.now() })} />
  ) : (
    <CodeStep
      phone={step.phone}
      sentAt={step.sentAt}
      onResent={() => setStep({ ...step, sentAt: Date.now() })}
      onChangeNumber={() => setStep({ name: 'phone' })}
    />
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  const c = useColors();
  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      contentContainerStyle={{ padding: Spacing.xl, gap: Spacing.xl }}>
      {children}
    </ScrollView>
  );
}

function Heading({ title, body }: { title: string; body: React.ReactNode }) {
  const c = useColors();
  return (
    <View style={{ alignItems: 'center', gap: Spacing.sm }}>
      <Image
        source={require('@/assets/images/icon.png')}
        style={{ width: 88, height: 88, borderRadius: 44, marginBottom: Spacing.sm }}
        accessibilityIgnoresInvertColors
      />
      <Text style={{ fontSize: 24, fontWeight: '800', color: c.label, textAlign: 'center' }}>{title}</Text>
      <Text style={{ fontSize: 15, color: c.secondaryLabel, textAlign: 'center' }}>{body}</Text>
    </View>
  );
}

function PhoneStep({ onSent }: { onSent: (phone: string) => void }) {
  const c = useColors();
  const t = useStrings();
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isValid = isValidPhone(phone);

  const submit = async () => {
    if (!isValid) {
      if (phone.trim()) setError(t.errPhoneInvalid);
      return;
    }
    setError(null);
    setSending(true);
    try {
      await sendOtp(phone);
      onSent(normalizePhone(phone));
    } catch {
      setError(t.errSendFailed);
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen>
      <Heading title={t.signInHeading} body={t.signInBody} />

      <View style={{ gap: Spacing.sm }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            minHeight: 58,
            borderRadius: Radius.md,
            borderCurve: 'continuous',
            backgroundColor: c.card,
            borderWidth: 2,
            borderColor: error ? c.danger : c.border,
            overflow: 'hidden',
          }}>
          <View
            style={{
              alignSelf: 'stretch',
              justifyContent: 'center',
              paddingHorizontal: Spacing.lg,
              backgroundColor: c.fill,
            }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: c.label }}>🇰🇭 +855</Text>
          </View>
          <TextInput
            value={phone}
            onChangeText={(value) => {
              setPhone(value);
              setError(null);
            }}
            placeholder={t.phonePlaceholder}
            placeholderTextColor={c.tertiaryLabel}
            selectionColor={c.accent}
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            autoComplete="tel"
            autoFocus
            maxLength={16}
            returnKeyType="done"
            onSubmitEditing={submit}
            accessibilityLabel={t.phone}
            style={{
              flex: 1,
              alignSelf: 'stretch',
              paddingHorizontal: Spacing.lg,
              fontSize: 19,
              fontWeight: '600',
              letterSpacing: 0.5,
              color: c.label,
            }}
          />
        </View>
        {error && <Text style={{ fontSize: 14, color: c.danger }}>{error}</Text>}
      </View>

      <ActionButton
        size="large"
        variant="primary"
        icon={ICONS.message}
        label={sending ? t.sendingCode : t.sendCode}
        loading={sending}
        disabled={!isValid}
        onPress={submit}
      />

      <Text style={{ fontSize: 13, color: c.tertiaryLabel, textAlign: 'center' }}>
        {t.signInNoAccountNeeded}
      </Text>
    </Screen>
  );
}

function CodeStep({
  phone,
  sentAt,
  onResent,
  onChangeNumber,
}: {
  phone: string;
  sentAt: number;
  onResent: () => void;
  onChangeNumber: () => void;
}) {
  const c = useColors();
  const { setUser } = useAuth();
  const t = useStrings();
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const secondsLeft = useCountdown(sentAt, RESEND_SECONDS);

  const verify = async (value: string) => {
    setVerifying(true);
    setError(null);
    try {
      const user = await verifyOtp(phone, value);
      setUser(user);
      router.back();
    } catch {
      setError(t.errCodeInvalid);
      setCode('');
    } finally {
      setVerifying(false);
    }
  };

  const resend = async () => {
    setError(null);
    try {
      await sendOtp(phone);
      onResent();
    } catch {
      setError(t.errSendFailed);
    }
  };

  return (
    <Screen>
      <Heading
        title={t.codeHeading}
        body={
          <>
            {t.codeSentTo(formatPhone(phone))}{' '}
            <Text onPress={onChangeNumber} style={{ color: c.accent, fontWeight: '700' }}>
              {t.changeNumber}
            </Text>
          </>
        }
      />

      <View style={{ gap: Spacing.md }}>
        <OtpInput
          value={code}
          length={OTP_LENGTH}
          hasError={!!error}
          disabled={verifying}
          onChange={(value) => {
            setCode(value);
            setError(null);
            if (value.length === OTP_LENGTH) verify(value);
          }}
        />
        {error && <Text style={{ fontSize: 14, color: c.danger, textAlign: 'center' }}>{error}</Text>}
        {verifying && (
          <Text style={{ fontSize: 14, color: c.secondaryLabel, textAlign: 'center' }}>{t.verifying}</Text>
        )}
      </View>

      <View style={{ alignItems: 'center', gap: Spacing.md }}>
        {secondsLeft > 0 ? (
          <Text style={{ fontSize: 15, color: c.tertiaryLabel, fontVariant: ['tabular-nums'] }}>
            {t.resendIn(secondsLeft)}
          </Text>
        ) : (
          <Pressable onPress={resend} accessibilityRole="button" hitSlop={8}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: c.accent }}>{t.resendCode}</Text>
          </Pressable>
        )}
        {isDemoMode && (
          <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.pill, backgroundColor: c.goldSoft }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: c.label }}>{t.demoCodeHint(DEMO_OTP)}</Text>
          </View>
        )}
      </View>
    </Screen>
  );
}

/** Whole seconds remaining until `start + seconds`, ticking once a second. */
function useCountdown(start: number, seconds: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [start]);
  return Math.max(0, Math.ceil((start + seconds * 1000 - now) / 1000));
}
