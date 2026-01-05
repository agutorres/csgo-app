import AsyncStorage from '@react-native-async-storage/async-storage';

const AD_FREE_END_TIME_KEY = 'adFreeEndTime';
const SESSION_VIDEO_COUNT_KEY = 'sessionVideoCount';
const REWARD_POPUP_SHOWN_KEY = 'rewardPopupShown';

class AdSessionService {
  // Ad-free period management
  async grantAdFreeHour(): Promise<void> {
    const endTime = Date.now() + 60 * 60 * 1000; // 1 hour from now
    await AsyncStorage.setItem(AD_FREE_END_TIME_KEY, endTime.toString());
  }

  async isAdFreeActive(): Promise<boolean> {
    try {
      const endTimeStr = await AsyncStorage.getItem(AD_FREE_END_TIME_KEY);
      if (!endTimeStr) return false;

      const endTime = parseInt(endTimeStr, 10);
      const now = Date.now();
      return now < endTime;
    } catch (error) {
      console.error('Error checking ad-free status:', error);
      return false;
    }
  }

  async clearAdFreePeriod(): Promise<void> {
    await AsyncStorage.removeItem(AD_FREE_END_TIME_KEY);
  }

  // Session tracking
  async incrementVideoCount(): Promise<number> {
    try {
      const countStr = await AsyncStorage.getItem(SESSION_VIDEO_COUNT_KEY);
      const count = countStr ? parseInt(countStr, 10) : 0;
      const newCount = count + 1;
      await AsyncStorage.setItem(SESSION_VIDEO_COUNT_KEY, newCount.toString());
      return newCount;
    } catch (error) {
      console.error('Error incrementing video count:', error);
      return 1;
    }
  }

  async getVideoCount(): Promise<number> {
    try {
      const countStr = await AsyncStorage.getItem(SESSION_VIDEO_COUNT_KEY);
      return countStr ? parseInt(countStr, 10) : 0;
    } catch (error) {
      console.error('Error getting video count:', error);
      return 0;
    }
  }

  async resetSession(): Promise<void> {
    await AsyncStorage.removeItem(SESSION_VIDEO_COUNT_KEY);
    await AsyncStorage.removeItem(REWARD_POPUP_SHOWN_KEY);
  }

  async hasShownRewardPopup(): Promise<boolean> {
    try {
      const shown = await AsyncStorage.getItem(REWARD_POPUP_SHOWN_KEY);
      return shown === 'true';
    } catch (error) {
      console.error('Error checking reward popup status:', error);
      return false;
    }
  }

  async setRewardPopupShown(): Promise<void> {
    await AsyncStorage.setItem(REWARD_POPUP_SHOWN_KEY, 'true');
  }
}

export const adSessionService = new AdSessionService();

