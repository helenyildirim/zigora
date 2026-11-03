import { Arrow, BoardInfo, Cell, DIRS, Dir } from './types';

export const cellKey = (x: number, y: number) => `${x},${y}`;

/** Cells between an arrow's head and the board edge. */
export function rayCells(head: Cell, dir: Dir, cols: number, rows: number): Cell[] {
  const out: Cell[] = [];
  const { x: dx, y: dy } = DIRS[dir];
  let x = head.x + dx;
  let y = head.y + dy;
  while (x >= 0 && y >= 0 && x < cols && y < rows) {
    out.push({ x, y });
    x += dx;
    y += dy;
  }
  return out;
}

/** The first arrow standing in `arrow`'s way, or null when its path is clear. */
export function findBlocker(arrow: Arrow, remaining: Arrow[], level: BoardInfo) {
  const owners = new Map<string, Arrow>();
  for (const other of remaining) {
    if (other.id === arrow.id) continue;
    for (const c of other.cells) owners.set(cellKey(c.x, c.y), other);
  }
  const head = arrow.cells[arrow.cells.length - 1];
  for (const cell of rayCells(head, arrow.dir, level.cols, level.rows)) {
    const owner = owners.get(cellKey(cell.x, cell.y));
    if (owner) return { blocker: owner, cell };
  }
  return null;
}

export const isFree = (arrow: Arrow, remaining: Arrow[], level: BoardInfo) =>
  findBlocker(arrow, remaining, level) === null;

/**
 * Removes every free arrow, wave after wave.
 * `solved` proves the board can be cleared; `depth` is the number of waves needed.
 */
export function solve(arrows: Arrow[], level: BoardInfo) {
  let remaining = arrows;
  let depth = 0;
  const firstWave = arrows.filter((a) => isFree(a, arrows, level)).length;
  while (remaining.length > 0) {
    const free = new Set(remaining.filter((a) => isFree(a, remaining, level)).map((a) => a.id));
    if (free.size === 0) break;
    remaining = remaining.filter((a) => !free.has(a.id));
    depth += 1;
  }
  return { solved: remaining.length === 0, depth, firstWave };
}

/** Distance from a point (in cell units) to an arrow's centre line. */
export function distanceToArrow(px: number, py: number, arrow: Arrow) {
  let best = Infinity;
  const pts = arrow.cells.map((c) => ({ x: c.x + 0.5, y: c.y + 0.5 }));
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const lenSq = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
    const t = Math.max(0, Math.min(1, ((px - a.x) * (b.x - a.x) + (py - a.y) * (b.y - a.y)) / lenSq));
    best = Math.min(best, Math.hypot(px - (a.x + t * (b.x - a.x)), py - (a.y + t * (b.y - a.y))));
  }
  return best;
}

/**
 * Finds the arrow under a tap. When two arrows are nearly the same distance from
 * the finger, the free one wins, so a slightly off tap does not cost a heart.
 */
export function pickArrow(
  px: number,
  py: number,
  remaining: Arrow[],
  level: BoardInfo,
  reach = 0.85,
  tieMargin = 0.22,
): Arrow | null {
  const near = remaining
    .map((arrow) => ({ arrow, d: distanceToArrow(px, py, arrow) }))
    .filter((n) => n.d <= reach)
    .sort((a, b) => a.d - b.d);
  if (near.length === 0) return null;
  const close = near.filter((n) => n.d <= near[0].d + tieMargin);
  return (close.find((n) => isFree(n.arrow, remaining, level)) ?? near[0]).arrow;
}
