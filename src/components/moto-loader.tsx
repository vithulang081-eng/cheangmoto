import { useState } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { Brand, type Palette, useColors } from '@/constants/theme';

const MOTO_W = 58;
const MOTO_H = 34;
const WHEEL = 15;
const LAP_MS = 2200;

type Props = {
  /** Width of the road. Defaults to filling the parent. */
  style?: ViewStyle;
  /** Draw with another palette (the splash uses the dark one on navy). */
  colors?: Palette;
};

/**
 * Loading indicator: a scooter rides along a road while the road fills in behind it.
 * Everything runs as Reanimated CSS keyframes on the UI thread; under Reduce Motion it stands still.
 */
export function MotoLoader({ style, colors }: Props) {
  const active = useColors();
  const c = colors ?? active;
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const ready = width > 0;

  const ride: ViewStyle =
    ready && !reduced
      ? {
          animationName: {
            from: { transform: [{ translateX: -MOTO_W }] },
            to: { transform: [{ translateX: width + 8 }] },
          },
          animationDuration: LAP_MS,
          animationIterationCount: 'infinite',
          animationTimingFunction: 'linear',
        }
      : { transform: [{ translateX: ready ? (width - MOTO_W) / 2 : 0 }] };

  const bob: ViewStyle = reduced
    ? {}
    : {
        animationName: {
          '0%': { transform: [{ translateY: 0 }] },
          '50%': { transform: [{ translateY: -1.5 }] },
          '100%': { transform: [{ translateY: 0 }] },
        },
        animationDuration: 260,
        animationIterationCount: 'infinite',
        animationTimingFunction: 'ease-in-out',
      };

  const spin: ViewStyle = reduced
    ? {}
    : {
        animationName: { from: { transform: [{ rotate: '0deg' }] }, to: { transform: [{ rotate: '360deg' }] } },
        animationDuration: 520,
        animationIterationCount: 'infinite',
        animationTimingFunction: 'linear',
      };

  const fill: ViewStyle =
    ready && !reduced
      ? {
          transformOrigin: 'left',
          animationName: { from: { transform: [{ scaleX: 0 }] }, to: { transform: [{ scaleX: 1 }] } },
          animationDuration: LAP_MS,
          animationIterationCount: 'infinite',
          animationTimingFunction: 'linear',
        }
      : { transformOrigin: 'left', transform: [{ scaleX: 0.5 }] };

  const puff = (delay: number): ViewStyle =>
    reduced
      ? { opacity: 0 }
      : {
          animationName: {
            '0%': { opacity: 0, transform: [{ translateX: 0 }, { scale: 0.4 }] },
            '30%': { opacity: 0.55 },
            '100%': { opacity: 0, transform: [{ translateX: -22 }, { scale: 1.3 }] },
          },
          animationDuration: 700,
          animationDelay: delay,
          animationIterationCount: 'infinite',
          animationTimingFunction: 'linear',
        };

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))}
      style={[{ alignSelf: 'stretch', height: MOTO_H + 14, overflow: 'hidden', justifyContent: 'flex-end' }, style]}>
      {/* road */}
      <View style={{ height: 3, borderRadius: 2, backgroundColor: c.border }} />
      <Animated.View
        style={[
          { position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, borderRadius: 2, backgroundColor: c.accent },
          fill,
        ]}
      />

      {/* scooter */}
      <Animated.View style={[{ position: 'absolute', left: 0, bottom: 2, width: MOTO_W, height: MOTO_H }, ride]}>
        <Animated.View style={[{ width: MOTO_W, height: MOTO_H }, bob]}>
          <Svg width={MOTO_W} height={MOTO_H} viewBox="0 0 58 34" style={{ position: 'absolute' }}>
            {/* rear mudguard + seat */}
            <Path d="M4 20 Q10 11 17 14 L17 20 Z" fill={c.accent} />
            <Path d="M14 12 Q22 8 31 11 L31 15 L14 15 Z" fill={Brand.charcoal} />
            {/* step-through body */}
            <Path d="M14 15 L31 15 L40 22 L36 26 L12 26 L10 20 Z" fill={c.primary} />
            {/* floorboard */}
            <Path d="M15 26 L36 26 L36 28 L15 28 Z" fill={c.accent} />
            {/* front shield + fork */}
            <Path d="M38 9 L46 9 L48 24 L42 24 Z" fill={c.primary} />
            <Line x1="46" y1="24" x2="47" y2="29" stroke={c.accent} strokeWidth="2.5" strokeLinecap="round" />
            <Line x1="12" y1="24" x2="10" y2="29" stroke={c.accent} strokeWidth="2.5" strokeLinecap="round" />
            {/* handlebar */}
            <Line x1="40" y1="9" x2="44" y2="4" stroke={Brand.charcoal} strokeWidth="2.5" strokeLinecap="round" />
            <Line x1="42" y1="4" x2="49" y2="4" stroke={Brand.charcoal} strokeWidth="2.5" strokeLinecap="round" />
            {/* headlight */}
            <Circle cx="47.5" cy="11.5" r="2.6" fill={Brand.gold} />
          </Svg>
          <Wheel style={[{ left: 3 }, spin]} rim={c.accent} />
          <Wheel style={[{ left: MOTO_W - WHEEL - 3 }, spin]} rim={c.accent} />
        </Animated.View>
        {/* dust */}
        <Animated.View style={[{ position: 'absolute', left: -6, bottom: 1, width: 8, height: 8, borderRadius: 4, backgroundColor: c.tertiaryLabel }, puff(0)]} />
        <Animated.View style={[{ position: 'absolute', left: -2, bottom: 3, width: 6, height: 6, borderRadius: 3, backgroundColor: c.tertiaryLabel }, puff(350)]} />
      </Animated.View>
    </View>
  );
}

function Wheel({ style, rim }: { style: ViewStyle[]; rim: string }) {
  return (
    <Animated.View style={[{ position: 'absolute', bottom: 0, width: WHEEL, height: WHEEL }, ...style]}>
      <Svg width={WHEEL} height={WHEEL} viewBox="0 0 15 15">
        <Circle cx="7.5" cy="7.5" r="6.2" fill="#FFFFFF" stroke={rim} strokeWidth="2.6" />
        <Line x1="7.5" y1="2.5" x2="7.5" y2="12.5" stroke={rim} strokeWidth="1.4" />
        <Line x1="2.5" y1="7.5" x2="12.5" y2="7.5" stroke={rim} strokeWidth="1.4" />
        <Circle cx="7.5" cy="7.5" r="1.6" fill={rim} />
      </Svg>
    </Animated.View>
  );
}
