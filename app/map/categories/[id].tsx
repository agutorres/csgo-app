import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Platform,
  Dimensions,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { ChevronLeft } from 'lucide-react-native';

type Map = Database['public']['Tables']['maps']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];
type CategorySection = Database['public']['Tables']['category_sections']['Row'];
type Video = Database['public']['Tables']['videos']['Row'];
type Callout = Database['public']['Tables']['callouts']['Row'];

interface CategoryWithData extends Category {
  category_sections: CategorySection[];
  totalVideos: number;
  thumbnail?: string;
}

export default function MapCategoriesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [map, setMap] = useState<Map | null>(null);
  const [categories, setCategories] = useState<CategoryWithData[]>([]);
  const [callouts, setCallouts] = useState<Callout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchMapAndCategories();
    }
  }, [id]);

  async function fetchMapAndCategories() {
    try {
      setLoading(true);
      setError(null);

      // Fetch map details
      const { data: mapData, error: mapError } = await supabase
        .from('maps')
        .select('*')
        .eq('id', id)
        .single();

      if (mapError) throw mapError;
      setMap(mapData);

      // Fetch callouts for this map
      const { data: calloutsData, error: calloutsError } = await supabase
        .from('callouts')
        .select('*')
        .eq('map_id', id)
        .order('name');

      if (calloutsError) {
        throw calloutsError;
      }
      setCallouts(calloutsData || []);

      // Fetch categories with sections
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select(`
          *,
          category_sections (
            *,
            videos (id)
          )
        `)
        .eq('map_id', id)
        .order('name');

      if (categoriesError) throw categoriesError;

      // Process categories to add total video count and thumbnail
      const processedCategories = await Promise.all(
        (categoriesData || []).map(async (category: any) => {
          // Count total videos across all sections
          const { count, error: countError } = await supabase
            .from('videos')
            .select('*', { count: 'exact', head: true })
            .eq('map_id', id)
            .in('category_section_id', category.category_sections.map((s: any) => s.id));

          const totalVideos = count || 0;

          // Get first available thumbnail from category sections
          let thumbnail = category.thumbnail_url;
          if (!thumbnail && category.category_sections.length > 0) {
            for (const section of category.category_sections) {
              if (section.thumbnail_url) {
                thumbnail = section.thumbnail_url;
                break;
              }
            }
          }

          return {
            ...category,
            totalVideos,
            thumbnail,
          };
        })
      );

      setCategories(processedCategories);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }

  function handleCategoryPress(category: CategoryWithData) {
    // Navigate directly to category sections
    router.push({
      pathname: '/map/category/[categoryId]/sections',
      params: { categoryId: category.id, mapId: id },
    });
  }

  type ListItem = { type: 'category'; data: CategoryWithData } | { type: 'callout'; data: Callout };

  const listItems: ListItem[] = [
    ...categories.map(cat => ({ type: 'category' as const, data: cat })),
    ...callouts.map(callout => ({ type: 'callout' as const, data: callout })),
  ];

  let calloutsRenderCount = 0;

  function renderItem({ item }: { item: ListItem }) {
    if (item.type === 'category') {
      return (
        <TouchableOpacity
          style={styles.categoryCard}
          onPress={() => handleCategoryPress(item.data)}
        >
          {item.data.thumbnail ? (
            <Image 
              source={{ uri: item.data.thumbnail }} 
              style={styles.categoryImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.categoryImagePlaceholder}>
              <Text style={styles.placeholderText}>
                {item.data.name.substring(0, 2).toUpperCase()}
              </Text>
            </View>
          )}
          
          <View style={styles.categoryOverlay}>
            <View style={styles.titleContainer}>
              <Text style={styles.cardTitle}>{item.data.name}</Text>
            </View>
            <View style={styles.videoCount}>
              <Text style={styles.videoCountText}>{item.data.totalVideos}</Text>
              <Image 
                source={require('@/assets/images/smoke.png')} 
                style={styles.smokeIcon}
                resizeMode="contain"
              />
            </View>
          </View>
        </TouchableOpacity>
      );
    } else {
      // Counter to prevent multiple renderings
      calloutsRenderCount++;
      if (calloutsRenderCount > 1) return null;
  
      return (
        <TouchableOpacity
          style={styles.categoryCard}
          onPress={() =>
            router.push({
              pathname: '/map/callouts',
              params: { mapId: id },
            })
          }
        >
          <Image
            source={require('@/assets/images/callouts.jpg')}
            style={styles.categoryImage}
            resizeMode="cover"
          />
          <View style={styles.categoryOverlay}>
            <View style={styles.titleContainer}>
              <Text style={styles.cardTitle}>Callouts</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }
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
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>{map?.name}</Text>
          <Text style={styles.subtitle}>Categories</Text>
        </View>
      </View>

      <FlatList
        data={listItems}
        renderItem={renderItem}
        keyExtractor={(item) => `${item.type}-${item.data.id}`}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No categories found for this map</Text>
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
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  list: {
    padding: 16,
    alignItems: 'center',
  },
  columnWrapper: {
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  categoryCard: {
    width: Dimensions.get('window').width * 0.45,
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0a0a0a',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  categoryImagePlaceholder: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#666',
  },
  categoryOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 16,
    justifyContent: 'space-between',
  },
  titleContainer: {
    alignSelf: 'flex-start',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  categoryDescription: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 8,
  },
  videoCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  videoCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fbbf24',
  },
  smokeIcon: {
    width: 14,
    height: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 16,
  },
});


