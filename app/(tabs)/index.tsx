import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, useWindowDimensions, Platform, Pressable } from 'react-native';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { User } from 'lucide-react-native';

type Map = Database['public']['Tables']['maps']['Row'];

interface MapWithStats extends Map {
  total_videos: number;
  status: 'active' | 'inactive';
}

export default function MapsScreen() {
  const insets = useSafeAreaInsets();
  const [maps, setMaps] = useState<MapWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  const { width } = useWindowDimensions();

  const isWeb = Platform.OS === 'web';
  const numColumns = isWeb && width > 1024 ? 3 : 2;
  
  // Calculate safe padding for iOS
  const safePaddingTop = Platform.OS === 'ios' ? Math.max(insets.top + 20, 60) : 60;

  useEffect(() => {
    fetchMaps();
  }, []);

  async function fetchMaps() {
    try {
      setLoading(true);
      setError(null);

      const { data: mapsData, error: mapsError } = await supabase
        .from('maps')
        .select('*')
        .order('name');

      if (mapsError) throw mapsError;

      const mapsWithStats = await Promise.all(
        (mapsData || []).map(async (map) => {
          const { count, error: videoError } = await supabase
            .from('videos')
            .select('*', { count: 'exact', head: true })
            .eq('map_id', map.id);

          if (videoError) console.warn(videoError.message);

          return {
            ...map,
            total_videos: count || 0,
            status: (map as any).status || 'active',
          };
        })
      );

      setMaps(mapsWithStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load maps');
    } finally {
      setLoading(false);
    }
  }

  const filteredMaps = maps.filter((map) => map.status === activeTab);

  function MapCard({ item, isWeb, isWide }: { item: MapWithStats; isWeb: boolean; isWide: boolean }) {
    const [hovered, setHovered] = useState(false);

    return (
      <Pressable
        onHoverIn={() => isWeb && setHovered(true)}
        onHoverOut={() => isWeb && setHovered(false)}
        onPress={() => router.push(`/map/categories/${item.id}`)}
        style={[
          styles.mapCard,
          {
            flexBasis: `${100 / (isWeb && isWide ? 3 : 2) - 2}%`,
            height: isWide ? 240 : 170,
            margin: isWide ? 6 : 8,
            transform: [{ scale: hovered ? 1.03 : 1 }],
            opacity: hovered ? 0.98 : 1,
            boxShadow: hovered && isWeb ? '0 0 18px 2px rgba(250, 204, 21, 0.5)' : 'none',
            transition: isWeb ? 'all 0.25s ease' : undefined,
          },
        ]}
      >
        <Image
          source={{ uri: item.thumbnail_url }}
          style={[
            styles.mapImage,
            hovered && isWeb ? { transform: [{ scale: 1.08 }] } : {},
          ]}
          resizeMode="cover"
        />
        <View style={styles.mapOverlay}>
          <View style={styles.mapHeader}>
            <Text style={[styles.mapName, isWide && styles.mapNameWeb]}>
              {item.name}
            </Text>
            <View style={[styles.videoCountContainer, isWide && styles.videoCountContainerWeb]}>
              <Image
                source={require('@/assets/images/smoke.png')}
                style={[styles.icon, isWide && styles.iconWeb]}
                resizeMode="contain"
              />
              <Text style={[styles.videoCount, isWide && styles.videoCountWeb]}>
                {item.total_videos}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchMaps}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: safePaddingTop }]}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => router.push('/(tabs)/profile')}>
          <User size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}>
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
            Active Maps
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'inactive' && styles.activeTab]}
          onPress={() => setActiveTab('inactive')}>
          <Text style={[styles.tabText, activeTab === 'inactive' && styles.activeTabText]}>
            Inactive Maps
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredMaps}
        renderItem={({ item }) => (
          <MapCard item={item} isWeb={isWeb} isWide={isWeb && width > 1024} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContainer, isWeb && styles.listContainerWeb]}
        numColumns={numColumns}
        columnWrapperStyle={[styles.row, isWeb && styles.rowWeb]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  logo: { width: 128, height: 128 },
  profileButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#333',
    alignItems: 'center',
  },
  activeTab: { backgroundColor: '#fff' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#999' },
  activeTabText: { color: '#000' },
  listContainer: { paddingHorizontal: 10 },
  listContainerWeb: { paddingHorizontal: 20 },
  row: { justifyContent: 'space-between' },
  rowWeb: { justifyContent: 'space-around' },
  mapCard: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    cursor: Platform.OS === 'web' ? 'pointer' : 'default',
  },
  mapImage: { width: '100%', height: '100%' },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    padding: 12,
    transition: 'all 0.25s ease',
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mapName: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  mapNameWeb: { fontSize: 22 },
  videoCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  videoCountContainerWeb: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  icon: { width: 18, height: 18 },
  iconWeb: { width: 26, height: 26 },
  videoCount: { color: '#facc15', fontSize: 16, fontWeight: '700' },
  videoCountWeb: { fontSize: 22 },
  errorText: { color: '#ff4444', textAlign: 'center', marginBottom: 8 },
  retryButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: { color: '#000', fontWeight: 'bold' },
});
