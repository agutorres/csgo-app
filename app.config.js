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

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.towersapp.fpsguide",
      googleServicesFile: "./GoogleService-Info.plist",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },

    android: {
      package: "com.towersapp.fpsguide",
      googleServicesFile: "./google-services.json",
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
            useFrameworks: "static", // required by Firebase iOS SDK
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
