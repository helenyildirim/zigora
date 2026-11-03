import data from './levels.json';
import { Arrow, DIRS, Dir, Level } from './types';

type StoredLevel = { s: string; c: number; r: number; h: number; a: string[] };

const stored = data as unknown as { logo: StoredLevel; levels: StoredLevel[] };
const cache = new Map<number, Level>();

export const LEVEL_COUNT = stored.levels.length;

/** Arrows are stored as "tailX,tailY,MOVES". Moves are U, D, L, R. */
function decodeArrow(text: string, id: number): Arrow {
  const [x, y, moves] = text.split(',');
  const cells = [{ x: Number(x), y: Number(y) }];
  for (const move of moves) {
    const last = cells[cells.length - 1];
    const step = DIRS[move as Dir];
    cells.push({ x: last.x + step.x, y: last.y + step.y });
  }
  return { id, cells, dir: moves[moves.length - 1] as Dir };
}

const decode = (level: StoredLevel, number: number): Level => ({
  number,
  shape: level.s,
  cols: level.c,
  rows: level.r,
  hard: level.h === 1,
  arrows: level.a.map(decodeArrow),
});

export function getLevel(number: number): Level {
  let level = cache.get(number);
  if (!level) {
    level = decode(stored.levels[number - 1], number);
    cache.set(number, level);
  }
  return level;
}

export const getLogoBoard = () => decode(stored.logo, 0);
