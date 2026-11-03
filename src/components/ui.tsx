import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, purpleShadow, softShadow } from '@/theme';

/** Screen frame with the soft corner shapes from the design. */
export function Screen({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 12) + 8 },
      ]}>
      <View pointerEvents="none" style={[styles.blob, styles.blobTop]} />
      <View pointerEvents="none" style={[styles.blob, styles.blobLeft]} />
      <View pointerEvents="none" style={[styles.blob, styles.blobRight]} />
      {children}
    </View>
  );
}

export function CircleButton({
  children,
  onPress,
  label,
}: {
  children: ReactNode;
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.circle, pressed && styles.pressed]}>
      {children}
    </Pressable>
  );
}

export function PrimaryButton({
  title,
  onPress,
  icon,
}: {
  title: string;
  onPress: () => void;
  icon?: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
      <LinearGradient
        colors={[colors.purpleLight, colors.purple]}
        style={styles.primaryFill}>
        <Text style={styles.primaryText}>{title}</Text>
        {icon}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, overflow: 'hidden' },
  blob: { position: 'absolute', backgroundColor: colors.blob, borderRadius: 999, opacity: 0.55 },
  blobTop: { width: 190, height: 190, top: -80, left: -60 },
  blobLeft: { width: 220, height: 220, bottom: -90, left: -80 },
  blobRight: { width: 260, height: 260, bottom: -130, right: -90 },
  circle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    boxShadow: softShadow,
  },
  pressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },
  primary: { borderRadius: 40, boxShadow: purpleShadow },
  primaryFill: {
    height: 66,
    borderRadius: 40,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#fff', fontFamily: fonts.bold, fontSize: 24 },
});
