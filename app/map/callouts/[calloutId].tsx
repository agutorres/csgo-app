import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { X } from 'lucide-react-native';

type Callout = Database['public']['Tables']['callouts']['Row'];

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function CalloutViewerScreen() {
  const { calloutId, imageUrl } = useLocalSearchParams<{ calloutId: string; imageUrl: string }>();
  const [callout, setCallout] = useState<Callout | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    if (calloutId) {
      fetchCallout();
    } else if (imageUrl) {
      // If imageUrl is provided directly, skip fetching
      setLoading(false);
      setImageLoading(false);
    }
  }, [calloutId, imageUrl]);

  async function fetchCallout() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('callouts')
        .select('*')
        .eq('id', calloutId)
        .single();

      if (error) throw error;
      setCallout(data);
    } catch (err) {
      console.error('Error fetching callout:', err);
    } finally {
      setLoading(false);
    }
  }

  const displayImageUrl = imageUrl || callout?.image_url;

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!displayImageUrl) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.errorContainer}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
        <X size={24} color="#fff" />
      </TouchableOpacity>
      
      {imageLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
      
      <Image
        source={{ uri: displayImageUrl }}
        style={styles.image}
        resizeMode="contain"
        onLoad={() => setImageLoading(false)}
        onError={() => setImageLoading(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: screenWidth,
    height: screenHeight,
  },
  loadingContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    padding: 20,
  },
});

