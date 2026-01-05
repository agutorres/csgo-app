# AdMob Setup Instructions

## The Problem

The error `'RNGoogleMobileAdsModule' could not be found` occurs because `react-native-google-mobile-ads` requires native code. Expo Go doesn't support custom native modules, so you need to build a **development build** instead.

## Solution: Build a Development Build

Since you're using Expo managed workflow, you need to build a custom development client that includes the AdMob native module.

### Step 1: Build Development Build with EAS

You have two options:

#### Option A: Build with EAS Build (Recommended - Cloud Build)

```bash
# Build for iOS
eas build --profile development --platform ios

# Build for Android
eas build --profile development --platform android
```

After the build completes, install the app on your device and then run:
```bash
npx expo start --dev-client
```

#### Option B: Build Locally (Faster for development)

First, generate native code:
```bash
npx expo prebuild
```

Then:
- **iOS**: Open `ios/csgo-app.xcworkspace` in Xcode and run the project
- **Android**: Run `npx expo run:android` or open `android` folder in Android Studio

After building locally, run:
```bash
npx expo start --dev-client
```

### Step 2: Install the Development Build

- **iOS**: Download and install the `.ipa` file from EAS Build, or use TestFlight
- **Android**: Download and install the `.apk` file from EAS Build

### Step 3: Run Your App

Once the development build is installed, run:
```bash
npx expo start --dev-client
```

Then open the development build app on your device (not Expo Go).

## Important Notes

1. **You can't use Expo Go** - AdMob requires native code that Expo Go doesn't support
2. **Development builds include native modules** - They're like a custom version of Expo Go with your native dependencies
3. **Test ads work in development** - The code uses test ad unit IDs in development mode
4. **Real ads require a build** - Production ads only work in release builds

## Testing AdMob

- The code automatically uses test ad unit IDs when `__DEV__` is true
- Test ads will show in development builds
- Make sure you test on a real device (ads don't work in simulators/emulators)

## Troubleshooting

If you still get errors after building:

1. Make sure you're running `npx expo start --dev-client` (not just `expo start`)
2. Make sure you opened the development build app (not Expo Go)
3. Clear cache: `npx expo start --dev-client --clear`
4. Rebuild the development build if you add new native dependencies

