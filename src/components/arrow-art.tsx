import { memo } from 'react';
import { Path } from 'react-native-svg';

import { DIRS, Arrow, Dir, Level } from '@/engine/types';

type Point = { x: number; y: number };

/** Line thickness and head size for a given cell size, in pixels. */
export const artSizes = (cell: number) => {
  const stroke = Math.max(1.6, Math.min(cell * 0.16, 6));
  return { stroke, headLength: stroke * 2.7, headWidth: stroke * 2.7 };
};

export function headPath(tip: Point, dir: Point, length: number, width: number) {
  const baseX = tip.x - dir.x * length;
  const baseY = tip.y - dir.y * length;
  const side = { x: -dir.y * (width / 2), y: dir.x * (width / 2) };
  return `M${tip.x} ${tip.y}L${baseX + side.x} ${baseY + side.y}L${baseX - side.x} ${baseY - side.y}Z`;
}

export const arrowPoints = (arrow: Arrow, cell: number, ox: number, oy: number): Point[] =>
  arrow.cells.map((c) => ({ x: ox + (c.x + 0.5) * cell, y: oy + (c.y + 0.5) * cell }));

export function polyline(points: Point[]) {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join('');
}

function ArrowShapeBase({
  arrow,
  cell,
  ox,
  oy,
  color,
}: {
  arrow: Arrow;
  cell: number;
  ox: number;
  oy: number;
  color: string;
}) {
  const { stroke, headLength, headWidth } = artSizes(cell);
  const points = arrowPoints(arrow, cell, ox, oy);
  const dir = DIRS[arrow.dir as Dir];
  const head = points[points.length - 1];
  const tip = { x: head.x + dir.x * cell * 0.42, y: head.y + dir.y * cell * 0.42 };
  return (
    <>
      <Path
        d={polyline(points) + `L${tip.x - dir.x * headLength * 0.7} ${tip.y - dir.y * headLength * 0.7}`}
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path d={headPath(tip, dir, headLength, headWidth)} fill={color} stroke={color} strokeWidth={1} strokeLinejoin="round" />
    </>
  );
}

export const ArrowShape = memo(ArrowShapeBase);

/** A whole board drawn at any size, for the logo and the win card. */
export function boardCell(level: Pick<Level, 'cols' | 'rows'>, width: number, height: number) {
  return Math.min(width / level.cols, height / level.rows);
}
