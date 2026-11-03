import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';

import { Arrow, Level } from '@/engine/types';
import type { Blocked, Exiting } from '@/hooks/use-game';
import { colors, fonts, softShadow } from '@/theme';

import { ArrowShape, artSizes, boardCell } from './arrow-art';
import { ExitLayer } from './exit-layer';

const SIDE_MARGIN = 12;
const MAX_CELL = 56;
const LARGEST_ZOOMED_CELL = 40;
const FINGER_REACH = 16;
const FINGER_ERROR = 6;
const START_CELL = 13;

const StaticArrows = memo(function StaticArrows({
  arrows,
  cell,
  ox,
  oy,
  hintId,
  blockedId,
}: {
  arrows: Arrow[];
  cell: number;
  ox: number;
  oy: number;
  hintId: number | null;
  blockedId: number | null;
}) {
  return arrows.map((arrow) => (
    <ArrowShape
      key={arrow.id}
      arrow={arrow}
      cell={cell}
      ox={ox}
      oy={oy}
      color={
        arrow.id === blockedId ? colors.red : arrow.id === hintId ? colors.purpleLight : colors.arrow
      }
    />
  ));
});

type View2D = { scale: number; x: number; y: number };

export function Board({
  level,
  remaining,
  hintId,
  blocked,
  exiting,
  onTapCell,
  onExitDone,
}: {
  level: Level;
  remaining: Arrow[];
  hintId: number | null;
  blocked: Blocked | null;
  exiting: Exiting[];
  onTapCell: (x: number, y: number, reach: number, tieMargin: number) => void;
  onExitDone: (key: number) => void;
}) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [view, setView] = useState<View2D>({ scale: 1, x: 0, y: 0 });

  // While fingers move the picture is only transformed. It is redrawn sharp when they lift.
  const liveScale = useSharedValue(1);
  const liveX = useSharedValue(0);
  const liveY = useSharedValue(0);
  const liveStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: liveX.value },
      { translateY: liveY.value },
      { scale: liveScale.value },
    ],
  }));
  useLayoutEffect(() => {
    liveScale.value = 1;
    liveX.value = 0;
    liveY.value = 0;
  }, [liveScale, liveX, liveY, view]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  };

  const fitCell = Math.min(
    MAX_CELL,
    boardCell(level, size.width - SIDE_MARGIN * 2, size.height - SIDE_MARGIN * 2),
  );
  const maxScale = Math.max(1, LARGEST_ZOOMED_CELL / fitCell);
  const cell = fitCell * view.scale;
  const ox = (size.width - cell * level.cols) / 2 + view.x;
  const oy = (size.height - cell * level.rows) / 2 + view.y;
  const ready = size.width > 0 && size.height > 0;

  // The biggest boards start zoomed in, so part of the tangle is off screen.
  const startedZoomed = useRef(false);
  useEffect(() => {
    if (!ready || startedZoomed.current) return;
    startedZoomed.current = true;
    if (fitCell < START_CELL) setView({ scale: START_CELL / fitCell, x: 0, y: 0 });
  }, [fitCell, ready]);

  const settle = (next: View2D): View2D => {
    const scale = Math.min(maxScale, Math.max(1, next.scale));
    const limitX = Math.max(0, (fitCell * scale * level.cols - size.width) / 2 + 40);
    const limitY = Math.max(0, (fitCell * scale * level.rows - size.height) / 2 + 40);
    return {
      scale,
      x: Math.max(-limitX, Math.min(limitX, next.x)),
      y: Math.max(-limitY, Math.min(limitY, next.y)),
    };
  };

  const zoomBy = (factor: number) => {
    setView((v) => {
      const scale = Math.min(maxScale, Math.max(1, v.scale * factor));
      const applied = scale / v.scale;
      return settle({ scale, x: v.x * applied, y: v.y * applied });
    });
  };

  // Brings the hinted arrow into view when the board is zoomed in.
  const hintedArrow = remaining.find((a) => a.id === hintId);
  useEffect(() => {
    if (!hintedArrow || view.scale === 1) return;
    const head = hintedArrow.cells[hintedArrow.cells.length - 1];
    setView((v) => {
      const c = fitCell * v.scale;
      return settle({
        ...v,
        x: (level.cols / 2 - head.x - 0.5) * c,
        y: (level.rows / 2 - head.y - 0.5) * c,
      });
    });
    // Only a new hint should move the board.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hintId]);

  const tap = Gesture.Tap()
    .runOnJS(true)
    .maxDistance(10)
    .onEnd((e, success) => {
      if (!success) return;
      onTapCell(
        (e.x - ox) / cell,
        (e.y - oy) / cell,
        Math.max(0.85, FINGER_REACH / cell),
        Math.max(0.22, FINGER_ERROR / cell),
      );
    });

  const pan = Gesture.Pan()
    .runOnJS(true)
    .minDistance(10)
    .onUpdate((e) => {
      if (view.scale === 1) return;
      liveX.value = e.translationX;
      liveY.value = e.translationY;
    })
    .onEnd((e) => {
      if (view.scale === 1) return;
      setView(settle({ ...view, x: view.x + e.translationX, y: view.y + e.translationY }));
    });

  const focal = useRef({ x: 0, y: 0 });
  const pinch = Gesture.Pinch()
    .runOnJS(true)
    .onBegin((e) => {
      focal.current = { x: e.focalX - size.width / 2, y: e.focalY - size.height / 2 };
    })
    .onUpdate((e) => {
      const s = Math.min(maxScale / view.scale, Math.max(1 / view.scale, e.scale));
      liveScale.value = s;
      liveX.value = focal.current.x * (1 - s);
      liveY.value = focal.current.y * (1 - s);
    })
    .onEnd((e) => {
      const s = Math.min(maxScale / view.scale, Math.max(1 / view.scale, e.scale));
      setView(
        settle({
          scale: view.scale * s,
          x: view.x * s + focal.current.x * (1 - s),
          y: view.y * s + focal.current.y * (1 - s),
        }),
      );
    });

  const zoomable = maxScale > 1.15;

  return (
    <View style={styles.wrap}>
      <GestureDetector gesture={Gesture.Simultaneous(pinch, pan, tap)}>
        <View style={styles.area} onLayout={onLayout} accessibilityLabel="Oyun tahtası">
          {ready && (
            <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, liveStyle]}>
              <Svg width={size.width} height={size.height}>
                {blocked && (
                  <Line
                    x1={ox + (blocked.path[0].x + 0.5) * cell}
                    y1={oy + (blocked.path[0].y + 0.5) * cell}
                    x2={ox + (blocked.path[1].x + 0.5) * cell}
                    y2={oy + (blocked.path[1].y + 0.5) * cell}
                    stroke={colors.red}
                    strokeOpacity={0.45}
                    strokeWidth={artSizes(cell).stroke}
                    strokeDasharray={`${cell * 0.18} ${cell * 0.22}`}
                    strokeLinecap="round"
                  />
                )}
                <StaticArrows
                  arrows={remaining}
                  cell={cell}
                  ox={ox}
                  oy={oy}
                  hintId={hintId}
                  blockedId={blocked?.arrowId ?? null}
                />
              </Svg>
              <ExitLayer
                exiting={exiting}
                cell={cell}
                ox={ox}
                oy={oy}
                width={size.width}
                height={size.height}
                onDone={onExitDone}
              />
            </Animated.View>
          )}
        </View>
      </GestureDetector>

      {zoomable && (
        <View style={styles.zoom}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Yakınlaştır"
            hitSlop={6}
            style={styles.zoomButton}
            onPress={() => zoomBy(1.5)}>
            <Text style={styles.zoomText}>+</Text>
          </Pressable>
          <View style={styles.zoomLine} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Uzaklaştır"
            hitSlop={6}
            style={styles.zoomButton}
            onPress={() => zoomBy(1 / 1.5)}>
            <Text style={styles.zoomText}>−</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, width: '100%' },
  area: { flex: 1, overflow: 'hidden' },
  zoom: {
    position: 'absolute',
    right: 12,
    bottom: 6,
    width: 42,
    borderRadius: 21,
    alignItems: 'center',
    backgroundColor: colors.card,
    boxShadow: softShadow,
  },
  zoomButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  zoomText: { fontFamily: fonts.semibold, fontSize: 24, lineHeight: 28, color: colors.ink },
  zoomLine: { width: 22, height: 1, backgroundColor: colors.line },
});
