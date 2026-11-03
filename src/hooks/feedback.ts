import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { useProgress } from '@/store/progress';

const enabled = () => Platform.OS !== 'web' && useProgress.getState().haptics;

export const tapFeedback = () => {
  if (enabled()) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export const errorFeedback = () => {
  if (enabled()) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
};

export const winFeedback = () => {
  if (enabled()) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};
