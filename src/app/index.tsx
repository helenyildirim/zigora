import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PlayIcon, GearIcon } from '@/components/icons';
import { MiniBoard } from '@/components/mini-board';
import { CircleButton, PrimaryButton, Screen } from '@/components/ui';
import { getLogoBoard } from '@/engine/levels';
import { useProgress } from '@/store/progress';
import { colors, fonts } from '@/theme';

const logo = getLogoBoard();

export default function HomeScreen() {
  const current = useProgress((s) => s.current);

  return (
    <Screen>
      <View style={styles.top}>
        <CircleButton label="Ayarlar" onPress={() => router.push('/settings')}>
          <GearIcon />
        </CircleButton>
      </View>

      <View style={styles.hero}>
        <MiniBoard level={logo} width={250} height={220} />
        <Text style={styles.title}>Zigora</Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton
          title="Oyna"
          icon={<PlayIcon size={24} color="#fff" filled />}
          onPress={() => router.push('/levels')}
        />
        <View style={styles.levelRow}>
          <View style={styles.dash} />
          <Text style={styles.level}>Seviye {current}</Text>
          <View style={styles.dash} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { alignItems: 'flex-end', paddingHorizontal: 20 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 },
  title: { fontFamily: fonts.black, fontSize: 62, color: colors.ink, letterSpacing: -1 },
  actions: { paddingHorizontal: 40, gap: 20, paddingBottom: 56 },
  levelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 6 },
  dash: { width: 30, height: 1.5, backgroundColor: colors.faint },
  level: { fontFamily: fonts.semibold, fontSize: 18, color: colors.ink },
});
