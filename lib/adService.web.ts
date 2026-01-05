// Web stub for AdMob services to prevent importing native-only modules

export async function initializeAdMob() {
    // No-op on web
}

class RewardedAdServiceWeb {
    async loadRewardedAd() {
        // No-op on web
    }
    async showRewardedAd(): Promise<boolean> {
        return false;
    }
    isAdLoaded(): boolean {
        return false;
    }
}

class InterstitialAdServiceWeb {
    async loadInterstitialAd() {
        // No-op on web
    }
    async showInterstitialAd(): Promise<boolean> {
        return false;
    }
    isAdLoaded(): boolean {
        return false;
    }
}

export const rewardedAdService = new RewardedAdServiceWeb();
export const interstitialAdService = new InterstitialAdServiceWeb();
