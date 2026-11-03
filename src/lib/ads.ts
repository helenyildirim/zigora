import Constants, { ExecutionEnvironment } from 'expo-constants';
import type * as GoogleAds from 'react-native-google-mobile-ads';

const LOAD_TIMEOUT = 15000;

/** Expo Go has no native ad code, so the reward is simply given there during development. */
const inExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/**
 * Shows one rewarded ad and resolves true only if the player earned the reward.
 * This uses Google's test ad until a real AdMob ad unit is set up.
 */
export async function showRewardedAd(): Promise<boolean> {
  if (inExpoGo) return true;

  const ads = require('react-native-google-mobile-ads') as typeof GoogleAds;
  const { AdEventType, RewardedAd, RewardedAdEventType, TestIds } = ads;
  await ads.default().initialize();

  return new Promise((resolve) => {
    const ad = RewardedAd.createForAdRequest(TestIds.REWARDED, {
      requestNonPersonalizedAdsOnly: true,
    });
    let earned = false;
    const finish = (result: boolean) => {
      clearTimeout(timer);
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      resolve(result);
    };
    const timer = setTimeout(() => finish(false), LOAD_TIMEOUT);
    const unsubscribers = [
      ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        clearTimeout(timer);
        void ad.show();
      }),
      ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        earned = true;
      }),
      ad.addAdEventListener(AdEventType.CLOSED, () => finish(earned)),
      ad.addAdEventListener(AdEventType.ERROR, () => finish(false)),
    ];
    ad.load();
  });
}
