export default {
  expo: {
    name: "FPS Guide",
    slug: "FPS-Guide",
    version: "1.0.2",
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
      "@react-native-firebase/app",
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
