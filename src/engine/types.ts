export type Dir = 'U' | 'D' | 'L' | 'R';

export type Cell = { x: number; y: number };

/** `cells` runs from tail to head; the last step always matches `dir`. */
export type Arrow = {
  id: number;
  cells: Cell[];
  dir: Dir;
};

export type Level = {
  number: number;
  shape: string;
  cols: number;
  rows: number;
  arrows: Arrow[];
  hard: boolean;
};

export type BoardInfo = Pick<Level, 'cols' | 'rows'>;

export const DIRS: Record<Dir, Cell> = {
  U: { x: 0, y: -1 },
  D: { x: 0, y: 1 },
  L: { x: -1, y: 0 },
  R: { x: 1, y: 0 },
};

export const ALL_DIRS: Dir[] = ['U', 'R', 'D', 'L'];
