import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { X } from 'lucide-react-native';

type Callout = Database['public']['Tables']['callouts']['Row'];

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function CalloutsViewerScreen() {
  const { mapId } = useLocalSearchParams<{ mapId: string }>();
  const [callouts, setCallouts] = useState<Callout[]>([]);
  const [selectedCalloutIndex, setSelectedCalloutIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    if (mapId) {
      fetchCallouts();
    }
  }, [mapId]);

  async function fetchCallouts() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('callouts')
        .select('*')
        .eq('map_id', mapId)
        .order('name');

      if (error) throw error;
      setCallouts(data || []);
      setSelectedCalloutIndex(0);
    } catch (err) {
      console.error('Error fetching callouts:', err);
    } finally {
      setLoading(false);
    }
  }

  const selectedCallout = callouts[selectedCalloutIndex];

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (callouts.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.errorText}>No callouts found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
        <X size={24} color="#fff" />
      </TouchableOpacity>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {callouts.map((callout, index) => (
          <TouchableOpacity
            key={callout.id}
            style={[
              styles.tab,
              selectedCalloutIndex === index && styles.tabActive,
            ]}
            onPress={() => {
              setSelectedCalloutIndex(index);
              setImageLoading(true);
            }}>
            <Text
              style={[
                styles.tabText,
                selectedCalloutIndex === index && styles.tabTextActive,
              ]}>
              {callout.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Image Container */}
      <View style={styles.imageContainer}>
        {imageLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}

        {selectedCallout && (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            maximumZoomScale={5}
            minimumZoomScale={1}
            showsVerticalScrollIndicator={true}
            showsHorizontalScrollIndicator={true}
            bouncesZoom={true}
            scrollEnabled={true}
            pinchGestureEnabled={true}
            onScrollEndDrag={() => setImageLoading(false)}>
            <Image
              source={{ uri: selectedCallout.image_url }}
              style={styles.image}
              resizeMode="contain"
              onLoad={() => setImageLoading(false)}
              onError={() => setImageLoading(false)}
            />
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222128',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222128',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(34, 33, 40, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#222128',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a30',
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#1a1a20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1a1a20',
    minHeight: 48,
  },
  tabActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  tabText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  imageContainer: {
    flex: 1,
    backgroundColor: '#222128',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: screenHeight - 180,
  },
  image: {
    width: screenWidth,
    height: screenHeight - 180,
  },
  loadingContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
  },
});

