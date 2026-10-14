import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { cubicBezier, useReducedMotion } from 'react-native-reanimated';

import { MotoLoader } from '@/components/moto-loader';
import { Brand, Palettes, Spacing } from '@/constants/theme';
import { useStrings } from '@/hooks/use-settings';

const MIN_VISIBLE_MS = 1600;
const FADE_MS = 420;
const EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);

type Props = {
  /** Keep showing until the app has what it needs (saved session read, etc.). */
  ready: boolean;
};

/**
 * Branded boot screen: wordmark + the scooter riding its progress line on deep navy.
 * Takes over from the plain native splash, stays at least MIN_VISIBLE_MS, then fades away.
 */
export function AnimatedSplash({ ready }: Props) {
  const t = useStrings();
  const reduced = useReducedMotion();
  const [minElapsed, setMinElapsed] = useState(false);
  const [gone, setGone] = useState(false);
  const leaving = ready && minElapsed;

  useEffect(() => {
    const id = setTimeout(() => setMinElapsed(true), MIN_VISIBLE_MS);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!leaving) return;
    const id = setTimeout(() => setGone(true), reduced ? 0 : FADE_MS);
    return () => clearTimeout(id);
  }, [leaving, reduced]);

  if (gone) return null;

  return (
    <Animated.View
      pointerEvents={leaving ? 'none' : 'auto'}
      onLayout={() => SplashScreen.hideAsync()}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: Brand.deepNavy,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: leaving ? 0 : 1,
        transitionProperty: 'opacity',
        transitionDuration: reduced ? 0 : FADE_MS,
        transitionTimingFunction: EASE_OUT,
      }}>
      <Animated.View
        style={{
          alignItems: 'center',
          gap: Spacing.xl,
          width: 260,
          animationName: reduced
            ? undefined
            : {
                from: { opacity: 0, transform: [{ translateY: 10 }, { scale: 0.96 }] },
                to: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] },
              },
          animationDuration: 600,
          animationTimingFunction: EASE_OUT,
          animationFillMode: 'both',
        }}>
        <View style={{ alignItems: 'center', gap: Spacing.sm }}>
          <Text style={{ fontSize: 44, fontWeight: '900', letterSpacing: 0.5 }}>
            <Text style={{ color: '#FFFFFF' }}>ជាង</Text>
            <Text style={{ color: Brand.red }}>ម៉ូតូ</Text>
          </Text>
          <Text style={{ fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.72)', textAlign: 'center' }}>
            {t.splashTagline}
          </Text>
        </View>
        <MotoLoader colors={Palettes.dark} style={{ alignSelf: 'stretch' }} />
      </Animated.View>
    </Animated.View>
  );
}
