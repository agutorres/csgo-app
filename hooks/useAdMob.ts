import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { rewardedAdService, interstitialAdService, initializeAdMob } from '@/lib/adService';
import { adSessionService } from '@/lib/adSessionService';

// Check if we're in Expo Go
const isExpoGo = Constants.executionEnvironment === 'storeClient';

export function useAdMob() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAdFree, setIsAdFree] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' || isExpoGo) {
      setIsInitialized(true);
      return;
    }

    // Initialize AdMob
    initializeAdMob().then(() => {
      setIsInitialized(true);
      // Preload ads
      rewardedAdService.loadRewardedAd().catch(() => {});
      interstitialAdService.loadInterstitialAd().catch(() => {});
    });

    // Check ad-free status
    checkAdFreeStatus();

    // Check ad-free status periodically
    const interval = setInterval(checkAdFreeStatus, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const checkAdFreeStatus = async () => {
    const adFree = await adSessionService.isAdFreeActive();
    setIsAdFree(adFree);
  };

  const showRewardedAd = async (): Promise<boolean> => {
    const success = await rewardedAdService.showRewardedAd();
    if (success) {
      await adSessionService.grantAdFreeHour();
      await checkAdFreeStatus();
    }
    return success;
  };

  const showInterstitialAd = async (): Promise<boolean> => {
    const isAdFree = await adSessionService.isAdFreeActive();
    if (isAdFree) {
      return false; // Don't show ad if user has ad-free status
    }
    return await interstitialAdService.showInterstitialAd();
  };

  const trackVideoWatched = async (): Promise<{ isFirstVideo: boolean; shouldShowRewardPopup: boolean }> => {
    const count = await adSessionService.incrementVideoCount();
    const isFirstVideo = count === 1;
    const hasShownPopup = await adSessionService.hasShownRewardPopup();
    const shouldShowRewardPopup = isFirstVideo && !hasShownPopup;

    return { isFirstVideo, shouldShowRewardPopup };
  };

  const markRewardPopupShown = async () => {
    await adSessionService.setRewardPopupShown();
  };

  return {
    isInitialized,
    isAdFree,
    showRewardedAd,
    showInterstitialAd,
    trackVideoWatched,
    markRewardPopupShown,
  };
}

