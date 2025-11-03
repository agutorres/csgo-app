import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { Play, Users, User, MapPin } from 'lucide-react-native';

type Map = Database['public']['Tables']['maps']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];
type VideoCategory = Database['public']['Tables']['video_categories']['Row'];

interface MapWithStats extends Map {
  total_videos: number;
  categories: Category[];
  video_categories: VideoCategory[];
  status: 'active' | 'inactive';
}

export default function MapsScreen() {
  const [maps, setMaps] = useState<MapWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');

  useEffect(() => {
    fetchMaps();
  }, []);

  async function fetchMaps() {
    try {
      setLoading(true);
      setError(null);

      // Fetch maps with their categories and video counts
      const { data: mapsData, error: mapsError } = await supabase
        .from('maps')
        .select(`
          *,
          categories (
            id,
            name,
            thumbnail_url
          )
        `)
        .order('name');

      if (mapsError) throw mapsError;

      // For each map, get video counts and video categories
      const mapsWithStats = await Promise.all(
        (mapsData || []).map(async (map: any) => {
          // Get video count for this map
          const { count: videoCount } = await supabase
            .from('videos')
            .select('*', { count: 'exact', head: true })
            .eq('map_id', map.id);

          // Get video categories for this map
          const { data: videoCategories } = await supabase
            .from('video_categories')
            .select(`
              *,
              category_sections!inner (
                categories!inner (
                  map_id
                )
              )
            `)
            .eq('category_sections.categories.map_id', map.id);

          return {
            ...map,
            total_videos: videoCount || 0,
            categories: (map as any).categories || [],
            video_categories: videoCategories || [],
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

  const filteredMaps = maps.filter(map => map.status === activeTab);

  function renderMapItem({ item }: { item: MapWithStats }) {
    return (
      <TouchableOpacity
        style={styles.mapCard}
        onPress={() => router.push(`/map/categories/${item.id}`)}>
        <Image
          source={{ uri: item.thumbnail_url }}
          style={styles.mapImage}
          resizeMode="cover"
        />
        <View style={styles.mapOverlay}>
          <Text style={styles.mapName}>{item.name}</Text>
          
          {/* Video count and category thumbnails */}
          <View style={styles.mapStats}>
            <View style={styles.videoCountContainer}>
              <Play size={16} color="#fff" />
              <Text style={styles.videoCount}>{item.total_videos}</Text>
            </View>
            
            {/* Show first few video category thumbnails */}
            <View style={styles.categoryThumbnails}>
              {item.video_categories.slice(0, 3).map((videoCategory, index) => (
                <View key={videoCategory.id} style={styles.categoryThumbnail}>
                  {videoCategory.thumbnail_url ? (
                    <Image
                      source={{ uri: videoCategory.thumbnail_url }}
                      style={styles.categoryThumbnailImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.categoryThumbnailPlaceholder}>
                      <Text style={styles.categoryThumbnailText}>
                        {videoCategory.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
              {item.video_categories.length > 3 && (
                <View style={styles.moreCategories}>
                  <Text style={styles.moreCategoriesText}>
                    +{item.video_categories.length - 3}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
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
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image 
            source={require('@/assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}></Text>
        </View>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <User size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
            Active Maps
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'inactive' && styles.activeTab]}
          onPress={() => setActiveTab('inactive')}
        >
          <Text style={[styles.tabText, activeTab === 'inactive' && styles.activeTabText]}>
            Inactive Maps
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredMaps}
        renderItem={renderMapItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        numColumns={2}
        columnWrapperStyle={styles.row}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No {activeTab} maps found
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 128,
    height: 128,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
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
  activeTab: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  activeTabText: {
    color: '#000',
  },
  listContainer: {
    padding: 12,
  },
  row: {
    justifyContent: 'space-between',
  },
  mapCard: {
    flex: 1,
    margin: 8,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
  },
  mapName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  mapStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  videoCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  videoCount: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryThumbnails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryThumbnail: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  categoryThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  categoryThumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryThumbnailText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  moreCategories: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreCategoriesText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
});
