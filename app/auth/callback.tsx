import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle OAuth callback with URL parameters
        const url = await Linking.getInitialURL();
        if (url) {
          // Extract hash fragments from the URL (Supabase OAuth uses hash fragments)
          const hashParams = new URLSearchParams(url.split('#')[1] || '');
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          
          if (accessToken && refreshToken) {
            // Set the session with the tokens from the URL
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (error) {
              console.error('Auth callback error:', error);
              router.replace('/(tabs)');
              return;
            }
          }
        }

        // Get the current session
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Auth callback error:', error);
          router.replace('/(tabs)');
          return;
        }

        if (data.session) {
          router.replace('/(tabs)');
        } else {
          router.replace('/(tabs)');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        router.replace('/(tabs)');
      }
    };

    handleAuthCallback();
  }, [router, params]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#fff" />
      <Text style={styles.text}>Completing sign in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  text: {
    color: '#fff',
    fontSize: 16,
  },
});
