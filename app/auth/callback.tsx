import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
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
  }, [router]);

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
