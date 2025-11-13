import { useEffect, useRef } from 'react';
import { Stack, usePathname, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/lib/AuthContext';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import { trackScreenView } from '@/lib/ga4Analytics';

const GA_TRACKING_ID = 'G-S35TK3P4JD';

// Initialize Google Analytics script
function initGoogleAnalytics(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    // If already initialized, resolve immediately
    if ((window as any).gtag) {
      resolve();
      return;
    }

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer.push(args);
    }
    (window as any).gtag = gtag;

    // Load the gtag.js script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
    
    script.onload = () => {
      // Small delay to ensure gtag is fully available
      setTimeout(() => {
        try {
          // Configure Google Analytics
          (window as any).gtag('js', new Date());
          (window as any).gtag('config', GA_TRACKING_ID, {
            send_page_view: false, // We'll send page views manually to avoid duplicates
            debug_mode: process.env.NODE_ENV === 'development', // Enable debug in dev
          });
          if (process.env.NODE_ENV === 'development') {
            console.log('Google Analytics: Initialized successfully');
          }
          resolve();
        } catch (error) {
          console.error('Google Analytics: Error during initialization', error);
          resolve(); // Resolve anyway
        }
      }, 100);
    };
    
    script.onerror = () => {
      console.error('Failed to load Google Analytics script');
      resolve(); // Resolve anyway to not block
    };
    
    document.head.appendChild(script);
  });
}

// Track page view
function trackPageView(path: string) {
  if (typeof window === 'undefined' || !(window as any).gtag) {
    console.warn('Google Analytics: gtag not available');
    return;
  }

  const pagePath = path || window.location.pathname;
  const pageLocation = window.location.href;
  const pageTitle = document.title || 'FPS Guide';
  
  // For SPAs, use event-based page view tracking (GA4 recommended approach)
  (window as any).gtag('event', 'page_view', {
    page_path: pagePath,
    page_location: pageLocation,
    page_title: pageTitle,
  });
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Google Analytics: Page view tracked', { pagePath, pageLocation, pageTitle });
  }
}

// Google Analytics component to track page views (web) and screen views (mobile)
function GoogleAnalytics() {
  const pathname = usePathname();
  const segments = useSegments();
  const initialized = useRef(false);
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Web: Use gtag.js
      if (typeof window === 'undefined') return;

      // Initialize Google Analytics on first load
      if (!initialized.current) {
        initGoogleAnalytics().then(() => {
          // Wait a bit more to ensure gtag is fully loaded
          setTimeout(() => {
            // Track initial page view after initialization
            const currentPath = pathname || window.location.pathname;
            if ((window as any).gtag) {
              trackPageView(currentPath);
              previousPath.current = currentPath;
              initialized.current = true;
            }
          }, 200);
        });
      } else {
        // Track page view when route changes
        const currentPath = pathname || window.location.pathname;
        if (currentPath !== previousPath.current && (window as any).gtag) {
          trackPageView(currentPath);
          previousPath.current = currentPath;
        }
      }
    } else {
      // iOS/Android: Use HTTP requests to GA4
      if (!initialized.current) {
        // Track initial screen view
        const screenName = pathname || 'home';
        trackScreenView(screenName);
        previousPath.current = screenName;
        initialized.current = true;
      } else {
        // Track screen view when route changes
        const currentScreen = pathname || 'home';
        if (currentScreen !== previousPath.current) {
          trackScreenView(currentScreen);
          previousPath.current = currentScreen;
        }
      }
    }
  }, [pathname, segments]);

  // Also track when pathname changes via window location (web only)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    if (!initialized.current || !(window as any).gtag) return;

    const handleLocationChange = () => {
      const currentPath = window.location.pathname;
      if (currentPath !== previousPath.current) {
        trackPageView(currentPath);
        previousPath.current = currentPath;
      }
    };

    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', handleLocationChange);
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  return null;
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <LanguageProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
          <Stack.Screen name="reset-password" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <GoogleAnalytics />
        <StatusBar style="light" />
      </AuthProvider>
    </LanguageProvider>
  );
}
