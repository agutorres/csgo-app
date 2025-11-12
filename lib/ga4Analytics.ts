import { Platform } from 'react-native';
import Constants from 'expo-constants';

const GA_MEASUREMENT_ID = 'G-S35TK3P4JD';

// Generate a client ID (UUID format)
function generateClientId(): string {
  // Generate UUID-like ID: timestamp.random-random
  const timestamp = Date.now().toString(36);
  const random1 = Math.random().toString(36).substring(2, 15);
  const random2 = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random1}-${random2}`.substring(0, 36);
}

// Get or create client ID (stored in memory for this session)
let clientId: string | null = null;

function getOrCreateClientId(): string {
  if (!clientId) {
    clientId = generateClientId();
  }
  return clientId;
}

// Generate session ID (timestamp-based, resets after 30 minutes)
let sessionId: number | null = null;
let sessionStartTime: number = Date.now();

function getSessionId(): number {
  const now = Date.now();
  const thirtyMinutes = 30 * 60 * 1000;
  
  if (!sessionId || (now - sessionStartTime) > thirtyMinutes) {
    sessionId = Math.floor(now / 1000); // Unix timestamp
    sessionStartTime = now;
  }
  
  return sessionId;
}

// Track event to GA4 using the same endpoint format as gtag.js
export async function trackGA4Event(
  eventName: string,
  eventParams?: Record<string, any>
): Promise<void> {
  if (Platform.OS === 'web') {
    // For web, use the existing gtag implementation
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, eventParams);
    }
    return;
  }

  // For iOS/Android, use HTTP request to GA4 endpoint
  try {
    const clientIdValue = getOrCreateClientId();
    const sessionIdValue = getSessionId();
    const timestampMicros = Date.now() * 1000; // Convert to microseconds

    // Get device info
    const deviceModel = Constants.deviceName || Constants.deviceModelName || 'unknown';
    const osVersion = Platform.Version?.toString() || 'unknown';
    const appVersion = Constants.expoConfig?.version || '1.0.0';
    const bundleId = Constants.expoConfig?.ios?.bundleIdentifier || 'com.towersapp.fpsguide';

    // Build payload in the format GA4 expects (similar to gtag.js internal format)
    // GA4 uses query parameters in POST request
    const payload: Record<string, string> = {
      // Protocol version and measurement ID
      v: '2',
      tid: GA_MEASUREMENT_ID,
      
      // Client and session
      cid: clientIdValue,
      sid: sessionIdValue.toString(),
      _s: '1', // Session number
      
      // Event data
      en: eventName, // Event name
      _et: '100', // Engagement time (milliseconds)
      
      // Screen/page info
      dl: `${bundleId}://screen/${eventName}`, // Document location
      dt: eventName, // Document title
    };

    // Add event parameters with 'ep.' prefix (GA4 event parameter format)
    if (eventParams) {
      Object.entries(eventParams).forEach(([key, value]) => {
        // Clean key name (replace dots and special chars)
        const cleanKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
        payload[`ep.${cleanKey}`] = String(value);
      });
    }

    // Add user properties with 'up.' prefix
    payload['up.platform'] = Platform.OS;
    payload['up.device_model'] = deviceModel;
    payload['up.os_version'] = osVersion;
    payload['up.app_version'] = appVersion;
    payload['up.app_id'] = bundleId;

    // Build query string
    const queryParams = new URLSearchParams();
    Object.entries(payload).forEach(([key, value]) => {
      queryParams.append(key, value);
    });

    // Send to GA4 endpoint (same endpoint gtag.js uses)
    const url = `https://www.google-analytics.com/g/collect?${queryParams.toString()}`;
    
    // Use fetch to send the event (fire and forget)
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'User-Agent': `FPSGuide/${appVersion} (${Platform.OS}; ${deviceModel})`,
      },
    }).catch((error) => {
      // Silently fail - don't block the app
      if (__DEV__) {
        console.warn('GA4: Failed to send event', error);
      }
    });

    if (__DEV__) {
      console.log('GA4: Event sent', { eventName, eventParams });
    }
  } catch (error) {
    // Silently fail - don't block the app
    if (__DEV__) {
      console.warn('GA4: Error tracking event', error);
    }
  }
}

// Track screen view (for iOS/Android apps)
export async function trackScreenView(screenName: string, screenClass?: string): Promise<void> {
  await trackGA4Event('screen_view', {
    screen_name: screenName,
    screen_class: screenClass || screenName,
  });
}

// Track custom event
export async function trackEvent(eventName: string, parameters?: Record<string, any>): Promise<void> {
  await trackGA4Event(eventName, parameters);
}
