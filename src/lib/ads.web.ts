/** Ads only run in the mobile app, so the web version gives the reward directly. */
export async function showRewardedAd(): Promise<boolean> {
  return true;
}
