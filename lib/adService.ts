import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Check if we're in Expo Go (where native modules aren't available)
const isExpoGo = Constants.executionEnvironment === 'storeClient';

// Ad Unit IDs
const REWARDED_AD_UNIT_ID = __DEV__
  ? 'ca-app-pub-3940256099942544/5224354917' // Test ID
  : 'ca-app-pub-6296897963834789/9781483568';

// TODO: Create a separate interstitial ad unit in AdMob dashboard
// For now using rewarded ad unit ID - replace with your interstitial ad unit ID
const INTERSTITIAL_AD_UNIT_ID = __DEV__
  ? 'ca-app-pub-3940256099942544/1033173712' // Test ID
  : 'ca-app-pub-6296897963834789/9781483568'; // Replace with your interstitial ad unit ID

// Initialize AdMob (called from app root)
export async function initializeAdMob() {
  if (Platform.OS === 'web' || isExpoGo) {
    // AdMob doesn't work on web or Expo Go, so we skip initialization
    if (isExpoGo) {
      console.log('AdMob: Skipping initialization in Expo Go');
    }
    return;
  }

  try {
    const { mobileAds } = await import('react-native-google-mobile-ads');
    await mobileAds().initialize();
    console.log('AdMob initialized successfully');
  } catch (error) {
    console.error('Error initializing AdMob:', error);
  }
}

// Rewarded Ad Service
class RewardedAdService {
  private rewardedAd: any = null;
  private isLoaded = false;
  private isLoading = false;

  async loadRewardedAd() {
    if (Platform.OS === 'web' || isExpoGo || this.isLoading || this.isLoaded) {
      return;
    }

    try {
      const { RewardedAd, RewardedAdEventType, TestIds } = await import('react-native-google-mobile-ads');
      
      this.isLoading = true;
      const adUnitId = __DEV__ ? TestIds.REWARDED : REWARDED_AD_UNIT_ID;
      this.rewardedAd = RewardedAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
      });

      const unsubscribe = this.rewardedAd.addAdEventListener(
        RewardedAdEventType.LOADED,
        () => {
          console.log('Rewarded ad loaded');
          this.isLoaded = true;
          this.isLoading = false;
          unsubscribe();
        }
      );

      this.rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward: any) => {
        console.log('User earned reward:', reward);
      });

      this.rewardedAd.load();
    } catch (error) {
      console.error('Error loading rewarded ad:', error);
      this.isLoading = false;
    }
  }

  async showRewardedAd(): Promise<boolean> {
    if (Platform.OS === 'web' || isExpoGo) {
      return false;
    }

    if (!this.isLoaded || !this.rewardedAd) {
      console.log('Rewarded ad not loaded, loading now...');
      await this.loadRewardedAd();
      return false;
    }

    try {
      await this.rewardedAd.show();
      this.isLoaded = false;
      this.rewardedAd = null;
      // Reload for next time
      await this.loadRewardedAd();
      return true;
    } catch (error) {
      console.error('Error showing rewarded ad:', error);
      this.isLoaded = false;
      this.rewardedAd = null;
      return false;
    }
  }

  isAdLoaded(): boolean {
    return this.isLoaded;
  }
}

// Interstitial Ad Service
class InterstitialAdService {
  private interstitialAd: any = null;
  private isLoaded = false;
  private isLoading = false;

  async loadInterstitialAd() {
    if (Platform.OS === 'web' || isExpoGo || this.isLoading || this.isLoaded) {
      return;
    }

    try {
      const { InterstitialAd, AdEventType, TestIds } = await import('react-native-google-mobile-ads');
      
      this.isLoading = true;
      const adUnitId = __DEV__ ? TestIds.INTERSTITIAL : INTERSTITIAL_AD_UNIT_ID;
      this.interstitialAd = InterstitialAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
      });

      const unsubscribe = this.interstitialAd.addAdEventListener(
        AdEventType.LOADED,
        () => {
          console.log('Interstitial ad loaded');
          this.isLoaded = true;
          this.isLoading = false;
          unsubscribe();
        }
      );

      this.interstitialAd.addAdEventListener(AdEventType.ERROR, (error: any) => {
        console.error('Interstitial ad error:', error);
        this.isLoading = false;
        unsubscribe();
      });

      this.interstitialAd.load();
    } catch (error) {
      console.error('Error loading interstitial ad:', error);
      this.isLoading = false;
    }
  }

  async showInterstitialAd(): Promise<boolean> {
    if (Platform.OS === 'web' || isExpoGo) {
      return false;
    }

    if (!this.isLoaded || !this.interstitialAd) {
      console.log('Interstitial ad not loaded');
      return false;
    }

    try {
      await this.interstitialAd.show();
      this.isLoaded = false;
      this.interstitialAd = null;
      // Reload for next time
      await this.loadInterstitialAd();
      return true;
    } catch (error) {
      console.error('Error showing interstitial ad:', error);
      this.isLoaded = false;
      this.interstitialAd = null;
      return false;
    }
  }

  isAdLoaded(): boolean {
    return this.isLoaded;
  }
}

export const rewardedAdService = new RewardedAdService();
export const interstitialAdService = new InterstitialAdService();
