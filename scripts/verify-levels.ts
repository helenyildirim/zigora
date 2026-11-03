/* Proves every saved level can be cleared. Run: npm run verify */
import { solve } from '../src/engine/game';
import { getLevel, LEVEL_COUNT } from '../src/engine/levels';

let failures = 0;
const rows: string[] = [];

for (let n = 1; n <= LEVEL_COUNT; n++) {
  const level = getLevel(n);

  const seen = new Set<string>();
  let overlap = false;
  let badHead = false;
  for (const arrow of level.arrows) {
    if (arrow.cells.length < 2) badHead = true;
    const [a, b] = arrow.cells.slice(-2);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const expected = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] }[arrow.dir];
    if (dx !== expected[0] || dy !== expected[1]) badHead = true;
    for (const c of arrow.cells) {
      const key = `${c.x},${c.y}`;
      if (seen.has(key)) overlap = true;
      seen.add(key);
    }
  }
  const { solved, depth, firstWave } = solve(level.arrows, level);
  if (!solved || overlap || badHead || level.arrows.length === 0) {
    failures += 1;
    console.error(`FAIL level ${n}: solved=${solved} overlap=${overlap} badHead=${badHead}`);
  }
  const fill = seen.size;
  if (process.argv.includes('--table') && (n <= 12 || n % 10 === 0)) {
    rows.push(`${n}\t${level.shape}\t${level.cols}x${level.rows}\tarrows ${level.arrows.length}\tcells ${fill}\tfree ${firstWave}\tdepth ${depth}`);
  }
}
if (rows.length) console.log(rows.join('\n'));
console.log(`${LEVEL_COUNT - failures}/${LEVEL_COUNT} levels OK`);
process.exit(failures ? 1 : 0);
