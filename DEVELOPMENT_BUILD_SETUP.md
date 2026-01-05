# Development Build Setup for iPhone

Since your app uses custom native code (AdMob, Firebase), you need a **development build** instead of Expo Go.

## Quick Steps

### 1. Build a Development Build for iOS

```bash
# Make sure you have EAS CLI installed
npm install -g eas-cli

# Login to your Expo account
eas login

# Build a development build for iOS
eas build --profile development --platform ios
```

This will:
- Build your app with all native dependencies
- Create a development client that can load your JS bundle
- Provide a download link or TestFlight link

### 2. Install the Development Build on Your iPhone

**Option A: Direct Download (if available)**
- EAS will provide a download link after the build completes
- Open the link on your iPhone and install the app

**Option B: TestFlight (Recommended)**
- After the build completes, EAS will automatically submit it to TestFlight
- Install TestFlight app from App Store
- Accept the TestFlight invitation email
- Install your app from TestFlight

### 3. Start the Development Server

```bash
# In your project directory
npx expo start --dev-client
```

This starts the Metro bundler with development client mode.

### 4. Connect Your iPhone

**Option A: Scan QR Code (Now Works!)**
- Open your **development build app** (not Expo Go)
- Scan the QR code from the terminal
- The app will load your JavaScript bundle

**Option B: Manual Connection**
- Make sure your iPhone and computer are on the same Wi-Fi network
- In the development build app, manually enter the connection URL shown in the terminal

## Alternative: Local Development Build (Faster for Testing)

If you want to build locally (requires Xcode):

```bash
# Build and run on connected iPhone
npx expo run:ios
```

This will:
- Build the app locally
- Install it on your connected iPhone
- Start the development server automatically

## Troubleshooting

### "No usable data" error
- Make sure you're using the **development build app**, not Expo Go
- Ensure you ran `npx expo start --dev-client` (not just `expo start`)

### QR code doesn't work
- Check that iPhone and computer are on the same network
- Try manually entering the connection URL in the dev client app
- Check firewall settings

### Build takes too long
- Development builds only need to be rebuilt when you change native code
- JavaScript changes load instantly via the development server
- Consider using `npx expo run:ios` for local builds (much faster)

## Notes

- **First time**: Build the development client (takes 10-20 minutes)
- **After that**: Only rebuild if you change native dependencies or config
- **Daily use**: Just run `npx expo start --dev-client` and scan the QR code

