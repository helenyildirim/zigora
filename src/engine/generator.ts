import { cellKey, rayCells } from './game';
import { createRng, randInt, Rng, shuffled } from './rng';
import { rasterize } from './shapes';
import { ALL_DIRS, Arrow, Cell, DIRS, Dir, Level } from './types';

type Tuning = { size: number; maxLen: number; bend: number; hard: boolean; chain: number };

/** Simple silhouettes that still read well on small early boards. */
const SIMPLE = ['heart', 'star', 'diamond', 'circle', 'leaf', 'cat', 'flower', 'hexagon', 'clover'];

/** Ornate patterns with holes and fine detail, for bigger boards. */
const PLAYLIST = [
  ...SIMPLE,
  'moon', 'fish', 'drop', 'butterfly', 'house', 'tree', 'crown', 'cup', 'sun', 'gem',
  'shield', 'mandala', 'snowflake', 'lattice', 'ring', 'hollowHeart', 'hollowStar',
];

const OPENING: { shape: string; size: number; maxLen: number }[] = [
  { shape: 'square', size: 7, maxLen: 6 },
];

const shapeFor = (level: number) => {
  const list = level <= 10 ? SIMPLE : PLAYLIST;
  const index = level - OPENING.length - 1;
  const round = Math.floor(index / list.length);
  return shuffled(createRng(round * 101 + 3), list)[index % list.length];
};

/** Boards grow with the level and every tenth level is a bigger "Zor" board. */
function tuningFor(level: number): Tuning {
  const step = level % 10;
  const hard = step === 0;
  const light = level > 20 && step === 1;
  const size =
    level <= 10
      ? 12 + level
      : Math.min(32, Math.min(30, 20 + Math.floor((level - 11) / 6)) + (hard ? 2 : 0) - (light ? 2 : 0));
  return {
    size,
    maxLen: Math.min(14, 9 + Math.floor(level / 40)) + (hard ? 3 : 0),
    bend: 0.5,
    hard,
    chain: level <= 10 ? 5 : 6 + Math.min(4, level / 60) + (hard ? 2 : 0),
  };
}

/** Order in which the board fills up. Each one produces a different kind of chain. */
type Sweep = (x: number, y: number) => number;

function sweeps(cols: number, rows: number, rng: Rng): Sweep[] {
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const span = Math.hypot(cols, rows);
  const spin = rng() < 0.5 ? 1 : -1;
  const turn = rng() * Math.PI * 2;
  const spiral: Sweep = (x, y) => {
    const angle = ((Math.atan2(y - cy, x - cx) * spin + turn + Math.PI * 4) % (Math.PI * 2)) / (Math.PI * 2);
    return angle * 0.65 + (Math.hypot(x - cx, y - cy) / span) * 0.35;
  };
  const px = cols * (0.2 + rng() * 0.6);
  const py = rows * (0.2 + rng() * 0.6);
  const radial: Sweep = (x, y) => Math.hypot(x - px, y - py) / span;
  const a = rng() * Math.PI * 2;
  const wave = rng() * 0.5 + 0.2;
  const slanted: Sweep = (x, y) =>
    ((x * Math.cos(a) + y * Math.sin(a)) / span) * 0.8 + Math.sin(x * wave) * Math.cos(y * wave) * 0.12;
  return [spiral, radial, slanted];
}

/**
 * Arrows are placed in reverse solving order: the first one placed is the last one
 * the player removes. A new arrow only needs a path that avoids everything already
 * placed, so whatever gets placed later can always leave first. The board is
 * solvable by construction, and solve() double-checks it.
 */
class Builder {
  grid: number[][];
  arrows: Arrow[] = [];
  empties = new Map<string, Cell>();
  private dirCount: Record<Dir, number> = { U: 0, D: 0, L: 0, R: 0 };

  constructor(
    private mask: boolean[][],
    private rng: Rng,
    private tuning: Pick<Tuning, 'maxLen' | 'bend'>,
    private sweep: Sweep,
    private sweepWeight: number,
  ) {
    this.grid = mask.map((row) => row.map(() => -1));
    mask.forEach((row, y) =>
      row.forEach((on, x) => {
        if (on) this.empties.set(cellKey(x, y), { x, y });
      }),
    );
  }

  get cols() {
    return this.mask[0].length;
  }
  get rows() {
    return this.mask.length;
  }

  private isEmpty(x: number, y: number) {
    return this.mask[y]?.[x] === true && this.grid[y][x] === -1;
  }

  private rayIsClear(head: Cell, dir: Dir) {
    return rayCells(head, dir, this.cols, this.rows).every((c) => this.grid[c.y][c.x] === -1);
  }

  /** Walks backward from the head to build the arrow's body. */
  private grow(head: Cell, dir: Dir): Cell[] | null {
    const step = DIRS[dir];
    const neck = { x: head.x - step.x, y: head.y - step.y };
    if (!this.isEmpty(neck.x, neck.y)) return null;

    const ray = new Set(rayCells(head, dir, this.cols, this.rows).map((c) => cellKey(c.x, c.y)));
    if (ray.has(cellKey(neck.x, neck.y)) || ray.has(cellKey(head.x, head.y))) return null;
    const path = [head, neck];
    const used = new Set(path.map((c) => cellKey(c.x, c.y)));
    let heading: Cell = { x: -step.x, y: -step.y };
    const target = randInt(this.rng, 3, this.tuning.maxLen);

    while (path.length < target) {
      const last = path[path.length - 1];
      const straight = { x: last.x + heading.x, y: last.y + heading.y };
      const sides = shuffled(this.rng, [
        { x: heading.y, y: heading.x },
        { x: -heading.y, y: -heading.x },
      ]).map((d) => ({ x: last.x + d.x, y: last.y + d.y, d }));
      const options = [
        ...(this.rng() < this.tuning.bend ? sides : []),
        { ...straight, d: heading },
        ...sides,
      ];
      const next = options.find(
        (o) =>
          this.isEmpty(o.x, o.y) && !used.has(cellKey(o.x, o.y)) && !ray.has(cellKey(o.x, o.y)),
      );
      if (!next) break;
      path.push({ x: next.x, y: next.y });
      used.add(cellKey(next.x, next.y));
      heading = next.d;
    }
    return path.reverse();
  }

  /** Empty cells left with no empty neighbour can no longer hold an arrow. */
  private strandedBy(cells: Cell[]) {
    const taken = new Set(cells.map((c) => cellKey(c.x, c.y)));
    const free = (x: number, y: number) => this.isEmpty(x, y) && !taken.has(cellKey(x, y));
    let stranded = 0;
    for (const c of cells) {
      for (const d of ALL_DIRS) {
        const x = c.x + DIRS[d].x;
        const y = c.y + DIRS[d].y;
        if (!free(x, y)) continue;
        if (!ALL_DIRS.some((n) => free(x + DIRS[n].x, y + DIRS[n].y))) stranded += 1;
      }
    }
    return stranded;
  }

  private score(cells: Cell[], dir: Dir) {
    const head = cells[cells.length - 1];
    const covered = new Set(cells.map((c) => cellKey(c.x, c.y)));
    const blockedLater = rayCells(head, dir, this.cols, this.rows).filter(
      (c) => this.isEmpty(c.x, c.y) && !covered.has(cellKey(c.x, c.y)),
    ).length;
    let bends = 0;
    for (let i = 2; i < cells.length; i++) {
      const a = cells[i - 2];
      const c = cells[i];
      if (a.x !== c.x && a.y !== c.y) bends += 1;
    }
    const dirShare = this.dirCount[dir] / (this.arrows.length + 1);
    return (
      cells.length * 1.2 +
      bends * 1.1 +
      blockedLater * 0.9 -
      this.strandedBy(cells) * 5 -
      this.sweep(head.x, head.y) * this.sweepWeight -
      dirShare * 9 +
      this.rng() * 2.5
    );
  }

  private candidates(): { cells: Cell[]; dir: Dir }[] {
    const out: { cells: Cell[]; dir: Dir }[] = [];
    // Only cells near the filling front are tried, so the board fills in sweep order.
    const front = [...this.empties.values()]
      .sort((a, b) => this.sweep(a.x, a.y) - this.sweep(b.x, b.y))
      .slice(0, 36);
    const cells = shuffled(this.rng, front).slice(0, 18);
    for (const head of cells) {
      for (const dir of shuffled(this.rng, ALL_DIRS)) {
        if (!this.rayIsClear(head, dir)) continue;
        const body = this.grow(head, dir);
        if (body) out.push({ cells: body, dir });
      }
    }
    return out;
  }

  /** Fallback once the front is stuck: tries every empty cell that is left. */
  private anyCandidates() {
    return [...this.empties.values()].flatMap((head) =>
      ALL_DIRS.flatMap((dir) => {
        if (!this.rayIsClear(head, dir)) return [];
        const body = this.grow(head, dir);
        return body ? [{ cells: body, dir }] : [];
      }),
    );
  }

  private place(cells: Cell[], dir: Dir) {
    const id = this.arrows.length;
    this.arrows.push({ id, cells, dir });
    this.dirCount[dir] += 1;
    for (const c of cells) {
      this.grid[c.y][c.x] = id;
      this.empties.delete(cellKey(c.x, c.y));
    }
  }

  /** Lets a neighbouring arrow's tail absorb leftover cells where the rules allow it. */
  private absorbLeftovers() {
    let changed = true;
    while (changed) {
      changed = false;
      for (const cell of [...this.empties.values()]) {
        const owner = this.arrows.find((arrow) => {
          const tail = arrow.cells[0];
          if (Math.abs(tail.x - cell.x) + Math.abs(tail.y - cell.y) !== 1) return false;
          const head = arrow.cells[arrow.cells.length - 1];
          const onOwnRay = rayCells(head, arrow.dir, this.cols, this.rows).some(
            (c) => c.x === cell.x && c.y === cell.y,
          );
          if (onOwnRay) return false;
          // Arrows placed later leave first, so their paths must stay clear of this cell.
          return this.arrows.slice(arrow.id + 1).every((later) => {
            const h = later.cells[later.cells.length - 1];
            return !rayCells(h, later.dir, this.cols, this.rows).some(
              (c) => c.x === cell.x && c.y === cell.y,
            );
          });
        });
        if (!owner) continue;
        owner.cells.unshift(cell);
        this.grid[cell.y][cell.x] = owner.id;
        this.empties.delete(cellKey(cell.x, cell.y));
        changed = true;
      }
    }
  }

  build() {
    for (;;) {
      let options = this.candidates();
      if (options.length === 0) options = this.anyCandidates();
      if (options.length === 0) break;
      const best = options
        .map((o) => ({ ...o, s: this.score(o.cells, o.dir) }))
        .reduce((a, b) => (b.s > a.s ? b : a));
      this.place(best.cells, best.dir);
    }
    this.absorbLeftovers();
    return this.arrows;
  }
}

/** The same arrow pointing out of its other end. */
function turned(arrow: Arrow): Arrow {
  const cells = [...arrow.cells].reverse();
  const [a, b] = cells.slice(-2);
  const dir = ALL_DIRS.find((d) => DIRS[d].x === b.x - a.x && DIRS[d].y === b.y - a.y) as Dir;
  return { ...arrow, cells, dir };
}

/** Fast wave analysis of a board. Returns null when arrows block each other in a circle. */
function analyse(arrows: Arrow[], cols: number, rows: number) {
  const owner = new Int16Array(cols * rows).fill(-1);
  arrows.forEach((arrow, i) => {
    for (const c of arrow.cells) owner[c.y * cols + c.x] = i;
  });

  const blockedBy = arrows.map(() => [] as number[]);
  const blocks = arrows.map(() => [] as number[]);
  arrows.forEach((arrow, i) => {
    const head = arrow.cells[arrow.cells.length - 1];
    for (const c of rayCells(head, arrow.dir, cols, rows)) {
      const j = owner[c.y * cols + c.x];
      if (j === i) {
        blockedBy[i].push(-1);
        return;
      }
      if (j >= 0 && !blockedBy[i].includes(j)) {
        blockedBy[i].push(j);
        blocks[j].push(i);
      }
    }
  });
  if (blockedBy.some((list) => list.includes(-1))) return null;

  const waiting = blockedBy.map((list) => list.length);
  const wave = arrows.map(() => 1);
  const queue = arrows.flatMap((_, i) => (waiting[i] === 0 ? [i] : []));
  const firstWave = queue.length;
  let done = 0;
  while (done < queue.length) {
    const i = queue[done++];
    for (const j of blocks[i]) {
      wave[j] = Math.max(wave[j], wave[i] + 1);
      if (--waiting[j] === 0) queue.push(j);
    }
  }
  if (done < arrows.length) return null;
  return { firstWave, depth: Math.max(...wave) };
}

const hardness = (a: { firstWave: number; depth: number }) => a.depth * 3 - a.firstWave * 4;

/**
 * Turns arrows around wherever that leaves fewer free arrows or a longer chain.
 * Every change is checked, so the board always stays solvable.
 */
function harden(start: Arrow[], cols: number, rows: number, rng: Rng) {
  const arrows = [...start];
  let best = analyse(arrows, cols, rows);
  if (!best) return arrows;
  for (let pass = 0, improved = true; pass < 12 && improved; pass++) {
    improved = false;
    for (const i of shuffled(rng, arrows.map((_, index) => index))) {
      const original = arrows[i];
      arrows[i] = turned(original);
      const result = analyse(arrows, cols, rows);
      if (result && hardness(result) >= hardness(best)) {
        improved = improved || hardness(result) > hardness(best);
        best = result;
      } else {
        arrows[i] = original;
      }
    }
  }
  return arrows;
}

export function buildBoard(
  shape: string,
  size: number,
  tuning: Pick<Tuning, 'maxLen' | 'bend'> & { chain?: number },
  seed: number,
) {
  const mask = rasterize(shape, size);
  const rows = mask.length;
  const cols = mask[0].length;
  const total = mask.flat().filter(Boolean).length;
  const chain = tuning.chain ?? 1;

  let best: { arrows: Arrow[]; rank: number } | null = null;
  for (let attempt = 0; attempt < 12 && (!best || attempt < (size > 24 ? 1 : 2)); attempt++) {
    const rng = createRng(seed + attempt * 7919);
    for (const sweep of sweeps(cols, rows, rng)) {
      const built = new Builder(mask, rng, tuning, sweep, 14 + chain * 3).build();
      const arrows = harden(built, cols, rows, rng);
      const wave = analyse(arrows, cols, rows);
      if (!wave) continue;
      const { depth, firstWave } = wave;
      const counts = ALL_DIRS.map((d) => arrows.filter((a) => a.dir === d).length);
      const mostOneDir = Math.max(...counts) / arrows.length;
      const filled = arrows.reduce((sum, a) => sum + a.cells.length, 0) / total;
      const rank =
        filled * 70 + depth * chain - firstWave * chain * 2 + arrows.length * 0.4 - mostOneDir * 30;
      if (!best || rank > best.rank) best = { arrows, rank };
    }
  }
  if (!best) throw new Error(`No solvable board for ${shape} (${size})`);
  // Ids double as draw order and must not reveal the solving order.
  const arrows = shuffled(createRng(seed ^ 0x5bd1e995), best.arrows).map((a, id) => ({ ...a, id }));
  return { cols, rows, arrows };
}

export function generateLevel(number: number): Level {
  const seed = Math.imul(number, 2654435761) >>> 0;
  const opening = OPENING[number - 1];
  if (opening) {
    const board = buildBoard(opening.shape, opening.size, { maxLen: opening.maxLen, bend: 0.3 }, seed);
    return { number, shape: opening.shape, hard: false, ...board };
  }
  const tuning = tuningFor(number);
  const shape = shapeFor(number);
  return { number, shape, hard: tuning.hard, ...buildBoard(shape, tuning.size, tuning, seed) };
}
