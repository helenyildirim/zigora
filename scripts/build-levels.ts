/// <reference types="node" />
/* Generates all levels once and saves them, so the app opens every board instantly. */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildBoard, generateLevel } from '../src/engine/generator';
import { Level } from '../src/engine/types';

const LEVELS = 350;

const encode = (level: Omit<Level, 'number'>) => ({
  s: level.shape,
  c: level.cols,
  r: level.rows,
  h: level.hard ? 1 : 0,
  a: level.arrows.map((arrow) => {
    const [tail, ...rest] = arrow.cells;
    const moves = rest.map((cell, i) => {
      const before = arrow.cells[i];
      return cell.x > before.x ? 'R' : cell.x < before.x ? 'L' : cell.y > before.y ? 'D' : 'U';
    });
    return `${tail.x},${tail.y},${moves.join('')}`;
  }),
});

const logo = { shape: 'heart', hard: false, ...buildBoard('heart', 22, { maxLen: 14, bend: 0.5 }, 2026) };
const levels = Array.from({ length: LEVELS }, (_, i) => encode(generateLevel(i + 1)));

writeFileSync(
  join(__dirname, '../src/engine/levels.json'),
  JSON.stringify({ logo: encode(logo), levels }),
);
console.log(`Saved ${levels.length} levels`);
