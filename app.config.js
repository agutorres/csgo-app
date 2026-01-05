// Check if we're using Expo Go (plugins that require native code will be excluded)
const isExpoGo = process.env.EXPO_PUBLIC_USE_EXPO_GO === 'true';

export default {
  expo: {
    name: "FPS Guide",
    slug: "csgo-app",
    version: "1.0.4",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,

    // 🔁 EAS Updates (OTA)
    updates: {
      url: "https://u.expo.dev/99e04432-8b2b-4cc4-8f07-352d38e3c7ae",
    },

    // 🔑 Runtime version policy
    runtimeVersion: {
      policy: "appVersion",
    },

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.towersapp.fpsguide",
      googleServicesFile: "./GoogleService-Info.plist",
      runtimeVersion: {
        policy: "appVersion",
      },
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        GADApplicationIdentifier: "ca-app-pub-6296897963834789~1635438228",
      },
    },

    android: {
      package: "com.towersapp.fpsguide",
      googleServicesFile: "./google-services.json",
      runtimeVersion: {
        policy: "appVersion",
      },
    },

    web: {
      bundler: "metro",
      output: "single",
      favicon: "./assets/images/favicon.png",
    },

    plugins: [
      "expo-router",
      "expo-font",
      "expo-web-browser",
      "expo-video",
      [
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static",
          },
        },
      ],
      // Only include native plugins if NOT using Expo Go
      ...(isExpoGo ? [] : [
        "@react-native-firebase/app",
        [
          "react-native-google-mobile-ads",
          {
            androidAppId: "ca-app-pub-6296897963834789~1635438228",
            iosAppId: "ca-app-pub-6296897963834789~1635438228",
          },
        ],
      ]),
    ],

    experiments: {
      typedRoutes: true,
    },

    extra: {
      router: {},
      eas: {
        projectId: "99e04432-8b2b-4cc4-8f07-352d38e3c7ae",
      },
    },

    owner: "towersapp",
  },
};
