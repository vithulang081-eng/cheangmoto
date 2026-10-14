import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Linking, Text, View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { ICONS, Icon } from '@/components/icon';
import { Radius, Spacing, useColors } from '@/constants/theme';
import { useStrings } from '@/hooks/use-settings';
import { parseMechanicLink } from '@/utils/mechanic-link';

/** Scans a mechanic QR code and opens that shop. */
export function ScanScreen() {
  const c = useColors();
  const t = useStrings();
  const [permission, requestPermission] = useCameraPermissions();
  const [invalid, setInvalid] = useState(false);
  // The camera reports the same code many times a second; handle the first hit only.
  const handled = useRef(false);

  if (!permission) return <View style={{ flex: 1, backgroundColor: c.background }} />;

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.lg, padding: Spacing.xl, backgroundColor: c.background }}>
        <View style={{ width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: c.accentSoft }}>
          <Icon {...ICONS.camera} size={38} color={c.accent} />
        </View>
        <Text style={{ fontSize: 17, fontWeight: '600', color: c.label, textAlign: 'center' }}>{t.cameraPermission}</Text>
        <ActionButton
          variant="primary"
          icon={ICONS.camera}
          label={permission.canAskAgain ? t.allowCamera : t.openSettings}
          onPress={() => (permission.canAskAgain ? requestPermission() : Linking.openSettings())}
          style={{ alignSelf: 'stretch' }}
        />
      </View>
    );
  }

  const onScanned = ({ data }: { data: string }) => {
    if (handled.current) return;
    const id = parseMechanicLink(data);
    if (!id) {
      setInvalid(true);
      return;
    }
    handled.current = true;
    router.replace({ pathname: '/mechanic/[id]', params: { id } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={invalid ? undefined : onScanned}
      />

      {/* Viewfinder */}
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 240, height: 240 }}>
          {(['tl', 'tr', 'bl', 'br'] as const).map((corner) => (
            <View
              key={corner}
              style={{
                position: 'absolute',
                width: 44,
                height: 44,
                borderColor: invalid ? c.danger : '#FFFFFF',
                top: corner.startsWith('t') ? 0 : undefined,
                bottom: corner.startsWith('b') ? 0 : undefined,
                left: corner.endsWith('l') ? 0 : undefined,
                right: corner.endsWith('r') ? 0 : undefined,
                borderTopWidth: corner.startsWith('t') ? 4 : 0,
                borderBottomWidth: corner.startsWith('b') ? 4 : 0,
                borderLeftWidth: corner.endsWith('l') ? 4 : 0,
                borderRightWidth: corner.endsWith('r') ? 4 : 0,
                borderTopLeftRadius: corner === 'tl' ? 18 : 0,
                borderTopRightRadius: corner === 'tr' ? 18 : 0,
                borderBottomLeftRadius: corner === 'bl' ? 18 : 0,
                borderBottomRightRadius: corner === 'br' ? 18 : 0,
              }}
            />
          ))}
        </View>
      </View>

      <View style={{ position: 'absolute', left: Spacing.xl, right: Spacing.xl, bottom: Spacing.xxl + Spacing.lg, gap: Spacing.md, alignItems: 'center' }}>
        <View
          style={{
            paddingHorizontal: Spacing.lg,
            paddingVertical: Spacing.md,
            borderRadius: Radius.md,
            borderCurve: 'continuous',
            backgroundColor: 'rgba(0,0,0,0.6)',
          }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF', textAlign: 'center' }}>
            {invalid ? t.scanInvalid : t.scanHint}
          </Text>
        </View>
        {invalid && (
          <ActionButton
            variant="primary"
            icon={ICONS.scan}
            label={t.scanAgain}
            onPress={() => setInvalid(false)}
            style={{ alignSelf: 'stretch' }}
          />
        )}
      </View>
    </View>
  );
}
