import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { DIRS } from '@/engine/types';
import type { Exiting } from '@/hooks/use-game';
import { colors } from '@/theme';

import { arrowPoints, artSizes, headPath, polyline } from './arrow-art';

const DURATION = 420;

type Point = { x: number; y: number };

/** The part of a route between two distances, plus the direction at its end. */
function slice(route: Point[], from: number, to: number) {
  const out: Point[] = [];
  let walked = 0;
  let dir = { x: 0, y: 0 };
  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i];
    const b = route[i + 1];
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    const start = Math.max(from, walked);
    const end = Math.min(to, walked + length);
    if (end >= start) {
      const unit = { x: (b.x - a.x) / length, y: (b.y - a.y) / length };
      const at = (d: number) => ({ x: a.x + unit.x * (d - walked), y: a.y + unit.y * (d - walked) });
      if (out.length === 0) out.push(at(start));
      out.push(at(end));
      dir = unit;
    }
    walked += length;
  }
  return { points: out, dir };
}

function ExitingArrow({
  item,
  cell,
  ox,
  oy,
  width,
  height,
  now,
  onDone,
}: {
  item: Exiting;
  cell: number;
  ox: number;
  oy: number;
  width: number;
  height: number;
  now: number;
  onDone: (key: number) => void;
}) {
  const { arrow } = item;
  const body = arrowPoints(arrow, cell, ox, oy);
  const dir = DIRS[arrow.dir];
  const head = body[body.length - 1];
  const length = (arrow.cells.length - 1) * cell;
  const distanceOut = Math.max(width, height) + length;
  const route = [...body, { x: head.x + dir.x * distanceOut, y: head.y + dir.y * distanceOut }];

  const t = Math.max(0, Math.min(1, (now - item.startedAt) / DURATION));
  const eased = t * t;
  const travel = eased * distanceOut;

  useEffect(() => {
    if (t >= 1) onDone(item.key);
  }, [item.key, onDone, t]);

  const { points, dir: facing } = slice(route, travel, travel + length + cell * 0.1);
  if (points.length < 2) return null;
  const { stroke, headLength, headWidth } = artSizes(cell);
  const end = points[points.length - 1];
  const tip = { x: end.x + facing.x * cell * 0.3, y: end.y + facing.y * cell * 0.3 };
  return (
    <>
      <Path d={polyline(points)} stroke={colors.arrow} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d={headPath(tip, facing, headLength, headWidth)} fill={colors.arrow} />
    </>
  );
}

/** Slides removed arrows along their own body and off the screen, snake style. */
export function ExitLayer({
  exiting,
  cell,
  ox,
  oy,
  width,
  height,
  onDone,
}: {
  exiting: Exiting[];
  cell: number;
  ox: number;
  oy: number;
  width: number;
  height: number;
  onDone: (key: number) => void;
}) {
  const [now, setNow] = useState(0);
  const active = exiting.length > 0;

  useEffect(() => {
    if (!active) return;
    let frame = requestAnimationFrame(function loop() {
      setNow(performance.now());
      frame = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(frame);
  }, [active]);

  if (!active) return null;
  return (
    <Svg pointerEvents="none" width={width} height={height} style={StyleSheet.absoluteFill}>
      {exiting.map((item) => (
        <ExitingArrow
          key={item.key}
          item={item}
          cell={cell}
          ox={ox}
          oy={oy}
          width={width}
          height={height}
          now={now}
          onDone={onDone}
        />
      ))}
    </Svg>
  );
}
