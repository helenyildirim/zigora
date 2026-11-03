import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BackIcon } from '@/components/icons';
import { CircleButton, Screen } from '@/components/ui';
import { useProgress } from '@/store/progress';
import { colors, fonts, softShadow } from '@/theme';

export default function SettingsScreen() {
  const haptics = useProgress((s) => s.haptics);
  const setHaptics = useProgress((s) => s.setHaptics);
  const reset = useProgress((s) => s.reset);
  const [confirming, setConfirming] = useState(false);

  return (
    <Screen>
      <View style={styles.header}>
        <CircleButton label="Geri" onPress={() => router.back()}>
          <BackIcon />
        </CircleButton>
      </View>
      <Text style={styles.title}>Ayarlar</Text>

      <View style={styles.card}>
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: haptics }}
          style={styles.row}
          onPress={() => setHaptics(!haptics)}>
          <Text style={styles.rowText}>Titreşim</Text>
          <View style={[styles.track, haptics && styles.trackOn]}>
            <View style={[styles.knob, haptics && styles.knobOn]} />
          </View>
        </Pressable>
        <View style={styles.separator} />
        <Pressable
          accessibilityRole="button"
          style={styles.row}
          onPress={() => {
            if (!confirming) {
              setConfirming(true);
              return;
            }
            reset();
            setConfirming(false);
          }}>
          <Text style={[styles.rowText, confirming && styles.danger]}>
            {confirming ? 'Emin misin? Silmek için tekrar dokun' : 'İlerlemeyi Sıfırla'}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', paddingHorizontal: 20 },
  title: {
    fontFamily: fonts.bold,
    fontSize: 34,
    color: colors.ink,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
  },
  card: {
    marginHorizontal: 24,
    borderRadius: 26,
    backgroundColor: colors.card,
    boxShadow: softShadow,
  },
  row: {
    minHeight: 66,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowText: { fontFamily: fonts.semibold, fontSize: 17, color: colors.ink },
  danger: { color: colors.red },
  separator: { height: 1, marginHorizontal: 22, backgroundColor: colors.line },
  track: {
    width: 52,
    height: 31,
    padding: 3,
    borderRadius: 16,
    backgroundColor: colors.faint,
  },
  trackOn: { backgroundColor: colors.purple },
  knob: { width: 25, height: 25, borderRadius: 13, backgroundColor: '#fff' },
  knobOn: { transform: [{ translateX: 21 }] },
});
