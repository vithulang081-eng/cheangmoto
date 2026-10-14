import { useRef } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { Radius, useColors } from '@/constants/theme';

type Props = {
  value: string;
  onChange: (value: string) => void;
  length: number;
  hasError?: boolean;
  disabled?: boolean;
};

/**
 * Six boxes backed by one hidden input, so SMS autofill
 * (iOS "From Messages", Android SMS retriever) fills every box at once.
 */
export function OtpInput({ value, onChange, length, hasError, disabled }: Props) {
  const c = useColors();
  const inputRef = useRef<TextInput>(null);

  return (
    <Pressable onPress={() => inputRef.current?.focus()} accessibilityRole="none">
      <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center' }}>
        {Array.from({ length }, (_, i) => {
          const isActive = !disabled && i === Math.min(value.length, length - 1);
          return (
            <View
              key={i}
              style={{
                flex: 1,
                maxWidth: 52,
                aspectRatio: 0.84,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: Radius.md,
                borderCurve: 'continuous',
                backgroundColor: c.card,
                borderWidth: 2,
                borderColor: hasError ? c.danger : isActive ? c.accent : c.border,
              }}>
              <Text style={{ fontSize: 24, fontWeight: '700', color: c.label, fontVariant: ['tabular-nums'] }}>
                {value[i] ?? ''}
              </Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, length))}
        editable={!disabled}
        autoFocus
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={length}
        caretHidden
        accessibilityLabel="លេខកូដ"
        style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.011 }}
      />
    </Pressable>
  );
}
