import Svg from 'react-native-svg';

import { Level } from '@/engine/types';
import { colors } from '@/theme';

import { ArrowShape, boardCell } from './arrow-art';

export function MiniBoard({
  level,
  width,
  height,
  color = colors.arrow,
}: {
  level: Level;
  width: number;
  height: number;
  color?: string;
}) {
  const cell = boardCell(level, width, height);
  const ox = (width - cell * level.cols) / 2;
  const oy = (height - cell * level.rows) / 2;
  return (
    <Svg width={width} height={height}>
      {level.arrows.map((arrow) => (
        <ArrowShape key={arrow.id} arrow={arrow} cell={cell} ox={ox} oy={oy} color={color} />
      ))}
    </Svg>
  );
}
