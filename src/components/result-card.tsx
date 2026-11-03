import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { colors, fonts } from '@/theme';

export function ResultCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Animated.View entering={FadeIn.duration(220)} style={styles.overlay}>
      <Animated.View entering={ZoomIn.duration(260)} style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        {children}
      </Animated.View>
    </Animated.View>
  );
}

export function Stack({ children }: { children: ReactNode }) {
  return <View style={styles.stack}>{children}</View>;
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(120, 121, 140, 0.55)',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: 18,
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderRadius: 36,
    backgroundColor: colors.card,
    boxShadow: '0px 18px 40px rgba(36, 38, 58, 0.22)',
  },
  title: { fontFamily: fonts.black, fontSize: 38, color: colors.ink, textAlign: 'center' },
  stack: { width: '100%', gap: 12 },
});
