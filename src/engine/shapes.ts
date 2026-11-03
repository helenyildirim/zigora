/** Silhouettes as point tests on a [-1, 1] square (y grows downward). */
type ShapeTest = (x: number, y: number) => boolean;

const inCircle = (x: number, y: number, cx: number, cy: number, r: number) =>
  (x - cx) ** 2 + (y - cy) ** 2 <= r * r;

function inPolygon(x: number, y: number, points: number[][]) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

const starPoints = Array.from({ length: 10 }, (_, i) => {
  const r = i % 2 === 0 ? 1.04 : 0.46;
  const a = -Math.PI / 2 + (i * Math.PI) / 5;
  return [r * Math.cos(a), r * Math.sin(a) + 0.08];
});

export const SHAPES: Record<string, ShapeTest> = {
  square: () => true,
  diamond: (x, y) => Math.abs(x) + Math.abs(y) <= 1.02,
  circle: (x, y) => inCircle(x, y, 0, 0, 1),
  heart: (x, y) => {
    const a = x * 1.08;
    const b = -(y * 1.16 + 0.12) * 1.04;
    return (a * a + b * b - 1) ** 3 - a * a * b * b * b <= 0;
  },
  star: (x, y) => inPolygon(x, y, starPoints),
  leaf: (x, y) => {
    const u = (x - y) / Math.SQRT2;
    const v = (x + y) / Math.SQRT2;
    return inCircle(u, v, 0, 0.72, 1.24) && inCircle(u, v, 0, -0.72, 1.24);
  },
  cat: (x, y) =>
    inCircle(x, y, 0, 0.2, 0.8) ||
    inPolygon(x, y, [[-0.8, 0.1], [-0.76, -0.95], [-0.15, -0.45]]) ||
    inPolygon(x, y, [[0.8, 0.1], [0.76, -0.95], [0.15, -0.45]]),
  moon: (x, y) => inCircle(x, y, 0, 0, 1) && !inCircle(x, y, 0.52, -0.16, 0.76),
  drop: (x, y) =>
    inCircle(x, y, 0, 0.32, 0.68) ||
    inPolygon(x, y, [[0, -1.02], [-0.6, 0.02], [0.6, 0.02]]),
  flower: (x, y) => {
    const r = Math.hypot(x, y);
    const a = Math.atan2(y, x);
    return r <= 0.72 + 0.3 * Math.cos(5 * a - Math.PI / 2);
  },
  house: (x, y) =>
    inPolygon(x, y, [[0, -1], [1, -0.05], [0.72, -0.05], [0.72, 1], [-0.72, 1], [-0.72, -0.05], [-1, -0.05]]),
  butterfly: (x, y) => {
    const ax = Math.abs(x);
    return (
      inCircle(ax, y, 0.5, -0.35, 0.5) ||
      inCircle(ax, y, 0.42, 0.42, 0.4) ||
      (ax <= 0.12 && Math.abs(y) <= 0.8)
    );
  },
  fish: (x, y) =>
    (inCircle(x, y, -0.2, -0.5, 1.12) && inCircle(x, y, -0.2, 0.5, 1.12)) ||
    inPolygon(x, y, [[0.5, 0], [1, -0.62], [1, 0.62]]),
  tree: (x, y) =>
    inPolygon(x, y, [[0, -1], [0.62, -0.28], [0.3, -0.28], [0.85, 0.45], [-0.85, 0.45], [-0.3, -0.28], [-0.62, -0.28]]) ||
    (Math.abs(x) <= 0.2 && y >= 0.4 && y <= 1),
  hexagon: (x, y) => Math.abs(y) <= 0.88 && Math.abs(x) * 0.88 + Math.abs(y) * 0.5 <= 0.88,
  clover: (x, y) =>
    inCircle(x, y, 0, -0.5, 0.48) ||
    inCircle(x, y, 0, 0.5, 0.48) ||
    inCircle(x, y, -0.5, 0, 0.48) ||
    inCircle(x, y, 0.5, 0, 0.48) ||
    inCircle(x, y, 0, 0, 0.3),
  crown: (x, y) =>
    inPolygon(x, y, [[-1, -0.55], [-0.5, 0.02], [0, -0.85], [0.5, 0.02], [1, -0.55], [0.82, 0.55], [-0.82, 0.55]]) ||
    (Math.abs(x) <= 0.82 && y >= 0.62 && y <= 0.86),
  cup: (x, y) =>
    inPolygon(x, y, [[-0.62, -0.9], [0.62, -0.9], [0.5, -0.05], [0.14, 0.3], [0.14, 0.62], [0.5, 0.92], [-0.5, 0.92], [-0.14, 0.62], [-0.14, 0.3], [-0.5, -0.05]]) ||
    (inCircle(Math.abs(x), y, 0.62, -0.5, 0.34) && !inCircle(Math.abs(x), y, 0.62, -0.5, 0.17)),
  sun: (x, y) => {
    const a = Math.atan2(y, x);
    const spike = Math.abs(((a * 8) / (2 * Math.PI) + 8) % 1 - 0.5) * 2;
    return Math.hypot(x, y) <= 0.56 + 0.46 * spike;
  },
  gem: (x, y) =>
    inPolygon(x, y, [[-0.55, -0.82], [0.55, -0.82], [1, -0.25], [0, 0.98], [-1, -0.25]]) &&
    !(Math.abs(y + 0.25) <= 0.05 && Math.abs(x) <= 0.8),
  shield: (x, y) =>
    inPolygon(x, y, [[-0.85, -0.9], [0.85, -0.9], [0.85, 0.12], [0, 1], [-0.85, 0.12]]) &&
    !inPolygon(x * 2.4, y * 2.4 + 0.5, starPoints),
  mandala: (x, y) => {
    if (!inCircle(x, y, 0, 0, 1) || inCircle(x, y, 0, 0, 0.16)) return false;
    return !Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4).some((a) =>
      inCircle(x, y, 0.58 * Math.cos(a), 0.58 * Math.sin(a), 0.16),
    );
  },
  snowflake: (x, y) => {
    const r = Math.hypot(x, y);
    if (r > 1.02) return false;
    const a = ((Math.atan2(y, x) % (Math.PI / 3)) + Math.PI / 3) % (Math.PI / 3);
    const along = r * Math.cos(Math.min(a, Math.PI / 3 - a));
    const across = r * Math.sin(Math.min(a, Math.PI / 3 - a));
    return across <= 0.11 || (along >= 0.42 && along <= 0.78 && across <= 0.38 - Math.abs(along - 0.6));
  },
  lattice: (x, y) => {
    const cell = (v: number) => Math.abs(((v + 1) * 2.5) % 1 - 0.5);
    return !(cell(x) <= 0.2 && cell(y) <= 0.2);
  },
  ring: (x, y) => inCircle(x, y, 0, 0, 1) && !inCircle(x, y, 0, 0, 0.42),
  hollowHeart: (x, y) => SHAPES.heart(x, y) && !SHAPES.heart(x * 2.3, y * 2.3 + 0.18),
  hollowStar: (x, y) => inPolygon(x, y, starPoints) && !inCircle(x, y, 0, 0.08, 0.2),
};

/** Rasterizes a silhouette to a grid and crops the empty margins. */
export function rasterize(shape: string, size: number): boolean[][] {
  const test = SHAPES[shape];
  const grid = Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) =>
      test(((col + 0.5) / size) * 2 - 1, ((row + 0.5) / size) * 2 - 1),
    ),
  );
  const rows = grid.filter((row) => row.some(Boolean));
  const keptCols = Array.from({ length: size }, (_, col) => col).filter((col) =>
    rows.some((row) => row[col]),
  );
  return rows.map((row) => keptCols.map((col) => row[col]));
}
