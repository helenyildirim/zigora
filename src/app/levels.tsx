import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { BackIcon, CheckIcon, GearIcon, LockIcon } from '@/components/icons';
import { CircleButton, Screen } from '@/components/ui';
import { LEVEL_COUNT } from '@/engine/levels';
import { useProgress } from '@/store/progress';
import { colors, fonts, softShadow } from '@/theme';

const COLUMNS = 3;
const ROW_HEIGHT = 88;
const levels = Array.from({ length: LEVEL_COUNT }, (_, i) => i + 1);

function LevelTile({ level, current, done }: { level: number; current: number; done: boolean }) {
  const locked = level > current;
  const active = level === current;
  const inner = (
    <>
      <Text style={[styles.number, active && styles.numberActive, locked && styles.numberLocked]}>
        {level}
      </Text>
      {locked && <LockIcon size={15} color={colors.faint} />}
      {done && !active && (
        <View style={styles.check}>
          <CheckIcon size={11} color="#fff" strokeWidth={4} />
        </View>
      )}
    </>
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Seviye ${level}${locked ? ', kilitli' : ''}`}
      disabled={locked}
      onPress={() => router.push(`/game/${level}`)}
      style={({ pressed }) => [styles.tile, locked && styles.tileLocked, pressed && styles.pressed]}>
      {active ? (
        <LinearGradient colors={[colors.purpleLight, colors.purple]} style={styles.tileActive}>
          {inner}
        </LinearGradient>
      ) : (
        inner
      )}
    </Pressable>
  );
}

export default function LevelsScreen() {
  const current = useProgress((s) => s.current);
  const stars = useProgress((s) => s.stars);
  const firstRow = Math.max(0, Math.floor((current - 1) / COLUMNS) - 1);

  return (
    <Screen>
      <View style={styles.header}>
        <CircleButton label="Geri" onPress={() => router.back()}>
          <BackIcon />
        </CircleButton>
        <CircleButton label="Ayarlar" onPress={() => router.push('/settings')}>
          <GearIcon />
        </CircleButton>
      </View>
      <Text style={styles.title}>Seviyeler</Text>
      <Text style={styles.count}>
        {current} / {LEVEL_COUNT}
      </Text>

      <FlatList
        style={styles.list}
        data={levels}
        numColumns={COLUMNS}
        keyExtractor={(level) => String(level)}
        initialScrollIndex={firstRow}
        getItemLayout={(_, row) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * row, index: row })}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: level }) => (
          <LevelTile level={level} current={current} done={stars[level] !== undefined} />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 },
  title: {
    fontFamily: fonts.bold,
    fontSize: 34,
    color: colors.ink,
    textAlign: 'center',
    marginTop: 6,
  },
  count: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.purple,
    textAlign: 'center',
    marginBottom: 14,
  },
  list: { flex: 1 },
  content: { paddingHorizontal: 26, paddingBottom: 24 },
  row: { height: ROW_HEIGHT, gap: 12 },
  tile: {
    flex: 1,
    height: 76,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    boxShadow: softShadow,
  },
  tileLocked: { backgroundColor: '#F7F7FA', boxShadow: 'none' },
  tileActive: {
    ...StyleSheet.absoluteFill,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.75 },
  number: { fontFamily: fonts.bold, fontSize: 24, color: colors.ink },
  numberActive: { color: '#fff' },
  numberLocked: { fontSize: 18, color: colors.muted },
  check: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.purple,
  },
});
