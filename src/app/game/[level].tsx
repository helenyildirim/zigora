import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { Board } from '@/components/board';
import {
  BackIcon,
  BulbIcon,
  GearIcon,
  HeartIcon,
  RestartIcon,
  StarIcon,
  UndoIcon,
} from '@/components/icons';
import { MiniBoard } from '@/components/mini-board';
import { ResultCard, Stack } from '@/components/result-card';
import { CircleButton, PrimaryButton, Screen } from '@/components/ui';
import { getLevel, LEVEL_COUNT } from '@/engine/levels';
import { Level } from '@/engine/types';
import { MAX_HEARTS, useGame } from '@/hooks/use-game';
import { showRewardedAd } from '@/lib/ads';
import { useProgress } from '@/store/progress';
import { colors, fonts, softShadow } from '@/theme';

const clampLevel = (value: string | undefined) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? Math.min(LEVEL_COUNT, Math.max(1, parsed)) : 1;
};

export default function GameRoute() {
  const params = useLocalSearchParams<{ level: string }>();
  const number = clampLevel(params.level);
  // The key gives each level a fresh game state.
  return <Game key={number} level={getLevel(number)} />;
}

function Game({ level }: { level: Level }) {
  const game = useGame(level);
  const complete = useProgress((s) => s.complete);
  const refillHints = useProgress((s) => s.refillHints);
  const [showWin, setShowWin] = useState(false);
  const [adOffer, setAdOffer] = useState<'open' | 'loading' | 'failed' | null>(null);
  const won = game.status === 'won';

  useEffect(() => {
    if (!won) return;
    complete(level.number, game.stars, game.clean);
    const timer = setTimeout(() => setShowWin(true), 520);
    return () => clearTimeout(timer);
  }, [complete, game.clean, game.stars, level.number, won]);

  const askHint = () => {
    if (game.hints === 0) setAdOffer('open');
    else game.hint();
  };

  const watchAd = async () => {
    setAdOffer('loading');
    const earned = await showRewardedAd().catch(() => false);
    if (earned) refillHints();
    setAdOffer(earned ? null : 'failed');
  };

  const next = () => {
    if (level.number >= LEVEL_COUNT) router.replace('/levels');
    else router.replace(`/game/${level.number + 1}`);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <CircleButton label="Geri" onPress={() => router.dismissTo('/levels')}>
          <BackIcon />
        </CircleButton>
        <View style={styles.headerCenter}>
          <Text style={styles.levelTitle}>Seviye {level.number}</Text>
          <Text style={styles.levelCount}>/ {LEVEL_COUNT}</Text>
          {level.hard && (
            <View style={styles.hardTag}>
              <Text style={styles.hardText}>Zor</Text>
            </View>
          )}
        </View>
        <CircleButton label="Ayarlar" onPress={() => router.push('/settings')}>
          <GearIcon />
        </CircleButton>
      </View>

      <View style={styles.hearts} accessibilityLabel={`${game.hearts} can kaldı`}>
        {Array.from({ length: MAX_HEARTS }, (_, i) => (
          <HeartIcon
            key={i}
            size={30}
            filled={i < game.hearts}
            color={i < game.hearts ? colors.purple : colors.faint}
            strokeWidth={i < game.hearts ? 2 : 2.4}
          />
        ))}
      </View>

      <Board
        level={level}
        remaining={game.remaining}
        hintId={game.hintId}
        blocked={game.blocked}
        exiting={game.exiting}
        onTapCell={game.tap}
        onExitDone={game.finishExit}
      />

      <Text style={styles.tip}>
        {level.number === 1
          ? 'Önü açık olan oka dokun'
          : level.number === 2
            ? 'İki parmakla yakınlaştır, tek parmakla kaydır'
            : ' '}
      </Text>

      <View style={styles.toolbar}>
        <Pressable
          accessibilityRole="button"
          disabled={!game.canUndo}
          onPress={game.undo}
          style={({ pressed }) => [
            styles.tool,
            !game.canUndo && styles.toolOff,
            pressed && styles.toolPressed,
          ]}>
          <UndoIcon size={24} />
          <Text style={styles.toolText}>Geri Al</Text>
        </Pressable>
        <View style={styles.divider} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`İpucu, ${game.hints} hak kaldı`}
          onPress={askHint}
          style={({ pressed }) => [styles.tool, pressed && styles.toolPressed]}>
          <View>
            <BulbIcon size={24} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{game.hints}</Text>
            </View>
          </View>
          <Text style={styles.toolText}>İpucu</Text>
        </Pressable>
        <View style={styles.divider} />
        <Pressable
          accessibilityRole="button"
          onPress={game.restart}
          style={({ pressed }) => [styles.tool, pressed && styles.toolPressed]}>
          <RestartIcon size={22} />
          <Text style={styles.toolText}>Baştan</Text>
        </Pressable>
      </View>

      {showWin && (
        <ResultCard title="Harika!">
          <MiniBoard level={level} width={150} height={120} color={colors.ink} />
          <View style={styles.stars} accessibilityLabel={`${game.stars} yıldız`}>
            {Array.from({ length: 3 }, (_, i) => (
              <Animated.View key={i} entering={ZoomIn.delay(160 + i * 120).duration(240)}>
                <StarIcon
                  size={46}
                  filled={i < game.stars}
                  color={i < game.stars ? colors.purple : colors.faint}
                />
              </Animated.View>
            ))}
          </View>
          <Stack>
            <PrimaryButton
              title={level.number >= LEVEL_COUNT ? 'Seviyeler' : 'Devam Et'}
              onPress={next}
            />
          </Stack>
        </ResultCard>
      )}

      {game.status === 'lost' && (
        <ResultCard title="Canların bitti">
          <Text style={styles.lostText}>Sorun değil, bu bölümü yeniden dene.</Text>
          <Stack>
            <PrimaryButton
              title="Yeniden Başla"
              icon={<RestartIcon size={22} color="#fff" strokeWidth={2.4} />}
              onPress={game.restart}
            />
          </Stack>
        </ResultCard>
      )}
      {adOffer && (
        <ResultCard title="İpucun bitti">
          <Text style={styles.lostText}>
            {adOffer === 'failed'
              ? 'Reklam şu an açılamadı. Birazdan tekrar dene.'
              : 'Kısa bir reklam izle, ipuçların yenilensin.'}
          </Text>
          <Stack>
            <PrimaryButton
              title={adOffer === 'loading' ? 'Yükleniyor...' : 'Reklam İzle'}
              onPress={adOffer === 'loading' ? () => {} : watchAd}
            />
            <Pressable accessibilityRole="button" style={styles.cancel} onPress={() => setAdOffer(null)}>
              <Text style={styles.cancelText}>Vazgeç</Text>
            </Pressable>
          </Stack>
        </ResultCard>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: colors.card,
    boxShadow: softShadow,
  },
  levelCount: { fontFamily: fonts.semibold, fontSize: 14, color: colors.muted },
  levelTitle: { fontFamily: fonts.bold, fontSize: 19, color: colors.ink },
  hardTag: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: colors.purpleSoft,
  },
  hardText: { fontFamily: fonts.bold, fontSize: 12, color: colors.purple },
  hearts: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  tip: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 8,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    width: '92%',
    maxWidth: 380,
    height: 64,
    paddingHorizontal: 6,
    borderRadius: 32,
    backgroundColor: colors.card,
    boxShadow: softShadow,
    marginBottom: 8,
  },
  tool: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  toolOff: { opacity: 0.35 },
  toolPressed: { opacity: 0.6 },
  toolText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  divider: { width: 1.5, height: 30, backgroundColor: colors.line },
  badge: {
    position: 'absolute',
    top: -7,
    right: -9,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.purple,
  },
  badgeText: { fontFamily: fonts.bold, fontSize: 11, color: '#fff' },
  stars: { flexDirection: 'row', gap: 10 },
  cancel: { height: 44, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.muted },
  lostText: { fontFamily: fonts.medium, fontSize: 17, color: colors.muted, textAlign: 'center' },
});
