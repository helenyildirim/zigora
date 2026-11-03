import { useCallback, useRef, useState } from 'react';

import { findBlocker, isFree, pickArrow } from '@/engine/game';
import { Arrow, Cell, Level } from '@/engine/types';
import { useProgress } from '@/store/progress';

import { errorFeedback, tapFeedback, winFeedback } from './feedback';

export const MAX_HEARTS = 3;

export type Exiting = { key: number; arrow: Arrow; startedAt: number };
export type Blocked = { arrowId: number; path: Cell[] };

/** Removing a free arrow never hurts, so a level can only be lost through blocked taps. */
export function useGame(level: Level) {
  const [remaining, setRemaining] = useState(level.arrows);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [hintId, setHintId] = useState<number | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [blocked, setBlocked] = useState<Blocked | null>(null);
  const [exiting, setExiting] = useState<Exiting[]>([]);
  const [history, setHistory] = useState<Arrow[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const exitKey = useRef(0);
  const blockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hints = useProgress((s) => s.hints);
  const spendHint = useProgress((s) => s.spendHint);

  const status = remaining.length === 0 ? 'won' : hearts === 0 ? 'lost' : 'playing';

  const tap = useCallback(
    (cellX: number, cellY: number, reach: number, tieMargin: number) => {
      if (status !== 'playing') return;
      const arrow = pickArrow(cellX, cellY, remaining, level, reach, tieMargin);
      if (!arrow) return;

      const hit = findBlocker(arrow, remaining, level);
      if (hit) {
        errorFeedback();
        setHearts((h) => h - 1);
        setMistakes((m) => m + 1);
        setBlocked({ arrowId: arrow.id, path: [arrow.cells[arrow.cells.length - 1], hit.cell] });
        if (blockTimer.current) clearTimeout(blockTimer.current);
        blockTimer.current = setTimeout(() => setBlocked(null), 750);
        return;
      }

      const left = remaining.filter((a) => a.id !== arrow.id);
      setHintId(null);
      setBlocked(null);
      setRemaining(left);
      setExiting((list) => [...list, { key: exitKey.current++, arrow, startedAt: performance.now() }]);
      setHistory((h) => [...h, arrow]);
      if (left.length === 0) winFeedback();
      else tapFeedback();
    },
    [level, remaining, status],
  );

  const finishExit = useCallback((key: number) => {
    setExiting((list) => list.filter((e) => e.key !== key));
  }, []);

  const undo = useCallback(() => {
    if (status !== 'playing') return;
    const last = history[history.length - 1];
    if (!last) return;
    setHistory(history.slice(0, -1));
    setBlocked(null);
    setHintId(null);
    setRemaining((list) => [...list, last]);
    setExiting((list) => list.filter((e) => e.arrow.id !== last.id));
  }, [history, status]);

  const hint = useCallback(() => {
    if (status !== 'playing' || hints === 0 || hintId !== null) return;
    const next = remaining.find((a) => isFree(a, remaining, level));
    if (!next) return;
    setHintId(next.id);
    setHintUsed(true);
    spendHint();
    tapFeedback();
  }, [hintId, hints, level, remaining, spendHint, status]);

  const restart = useCallback(() => {
    setRemaining(level.arrows);
    setHearts(MAX_HEARTS);
    setHintId(null);
    setHintUsed(false);
    setBlocked(null);
    setExiting([]);
    setHistory([]);
    setMistakes(0);
  }, [level]);

  return {
    remaining,
    hearts,
    hints,
    hintId,
    blocked,
    exiting,
    status,
    canUndo: history.length > 0 && status === 'playing',
    stars: Math.max(1, 3 - mistakes),
    clean: mistakes === 0 && !hintUsed,
    tap,
    finishExit,
    undo,
    hint,
    restart,
  } as const;
}
