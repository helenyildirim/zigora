import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { LEVEL_COUNT } from '@/engine/levels';

type Progress = {
  /** The furthest level the player can open. */
  current: number;
  /** Best star count per finished level. */
  stars: Record<number, number>;
  haptics: boolean;
  /** Hints are shared across levels. Two clean first-time wins in a row earn one. */
  hints: number;
  cleanWins: number;
  complete: (level: number, stars: number, clean: boolean) => void;
  spendHint: () => void;
  setHaptics: (on: boolean) => void;
  reset: () => void;
};

export const useProgress = create<Progress>()(
  persist(
    (set) => ({
      current: 1,
      stars: {},
      haptics: true,
      hints: 5,
      cleanWins: 0,
      complete: (level, stars, clean) =>
        set((state) => {
          const firstWin = state.stars[level] === undefined;
          const cleanWins = firstWin ? (clean ? state.cleanWins + 1 : 0) : state.cleanWins;
          return {
            current: Math.min(LEVEL_COUNT, Math.max(state.current, level + 1)),
            stars: { ...state.stars, [level]: Math.max(state.stars[level] ?? 0, stars) },
            cleanWins: cleanWins % 2,
            hints: state.hints + (cleanWins === 2 ? 1 : 0),
          };
        }),
      spendHint: () => set((state) => ({ hints: Math.max(0, state.hints - 1) })),
      setHaptics: (haptics) => set({ haptics }),
      reset: () => set({ current: 1, stars: {}, hints: 5, cleanWins: 0 }),
    }),
    { name: 'zigora-progress', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
