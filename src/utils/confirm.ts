import { Alert } from 'react-native';

type Options = {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
};

/** Native confirmation dialog. React Native's Alert buttons don't fire on web, so it falls back to window.confirm. */
export function confirm({ title, message, confirmLabel, cancelLabel, destructive = false, onConfirm }: Options) {
  if (process.env.EXPO_OS === 'web') {
    if (globalThis.confirm([title, message].filter(Boolean).join('\n\n'))) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: cancelLabel, style: 'cancel' },
    { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}
