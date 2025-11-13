import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  Platform,
  useWindowDimensions,
  Pressable,
  Animated,
} from 'react-native';
import { useEffect, useState, useRef } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { ChevronLeft } from 'lucide-react-native';
import { useLanguage } from '@/lib/i18n/LanguageContext';

type Map = Database['public']['Tables']['maps']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

interface CategoryWithData extends Category {
  totalVideos: number;
  videoTypeCounts: {
    nade: number;
    smoke: number;
    flash: number;
    fire: number;
  };
  thumbnail?: string;
}

export default function MapCategoriesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [map, setMap] = useState<Map | null>(null);
  const [categories, setCategories] = useState<CategoryWithData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { width } = useWindowDimensions();

  const isWeb = Platform.OS === 'web';
  const isLargeScreen = width > 800;
  const isMobile = !isWeb;
  
  // Calculate safe padding for iOS
  const safePaddingTop = Platform.OS === 'ios' ? Math.max(insets.top, 48) : 48;

  // ✅ Layout sizing
  const cardWidth = isWeb ? width * 0.42 : width * 0.9; // one per row on mobile
  const cardHeight = isWeb ? width * 0.24 : width * 0.55; // proportional height

  useEffect(() => {
    if (id) fetchMapAndCategories();
  }, [id]);

  async function fetchMapAndCategories() {
    try {
      setLoading(true);
      setError(null);

      const { data: mapData, error: mapError } = await supabase
        .from('maps')
        .select('*')
        .eq('id', id)
        .single();
      if (mapError) throw mapError;
      setMap(mapData);

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('map_id', id)
        .order('name');
      if (categoriesError) throw categoriesError;

      const processed = await Promise.all(
        (categoriesData || []).map(async (category: any) => {
          // Get videos for this category (we need to check if videos belong to this category)
          // Since we removed category_sections, we'll count videos by map_id only for now
          // Note: This assumes videos are associated with categories through some other means
          // If videos don't have a direct category_id, we may need to adjust this
          const { data: videosData } = await supabase
            .from('videos')
            .select('video_type')
            .eq('map_id', id);

          const counts = { nade: 0, smoke: 0, flash: 0, fire: 0 };
          videosData?.forEach((v: any) => {
            const t = v.video_type as keyof typeof counts;
            if (counts[t] !== undefined) counts[t]++;
          });

          const totalVideos = Object.values(counts).reduce((a, b) => a + b, 0);
          let thumbnail = category.thumbnail_url;

          return { ...category, totalVideos, thumbnail, videoTypeCounts: counts };
        })
      );

      setCategories(processed);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorLoading'));
    } finally {
      setLoading(false);
    }
  }

  function handleCategoryPress(category: CategoryWithData) {
    router.push({
      pathname: '/map/category/[categoryId]/sections',
      params: { categoryId: category.id, mapId: id },
    });
  }

  function handleCalloutPress() {
    router.push({ pathname: '/map/callouts', params: { mapId: id } });
  }

  const icons = {
    nade: require('@/assets/images/nade.png'),
    smoke: require('@/assets/images/smoke.png'),
    flash: require('@/assets/images/flash.png'),
    fire: require('@/assets/images/fire.png'),
  };

  // Map of map names to their smoke image files (case-insensitive matching)
  const mapSmokeImages: Record<string, any> = {
    'ancient': require('@/assets/images/map smokes/Ancient smoke.jpg'),
    'anubis': require('@/assets/images/map smokes/Anubis smoke.jpg'),
    'dust 2': require('@/assets/images/map smokes/dust 2 smoke.jpg'),
    'dust2': require('@/assets/images/map smokes/dust 2 smoke.jpg'),
    'inferno': require('@/assets/images/map smokes/Inferno smoke.jpg'),
    'mirage': require('@/assets/images/map smokes/mirage smoke.jpg'),
    'nuke': require('@/assets/images/map smokes/Nuke smoke.jpg'),
    'overpass': require('@/assets/images/map smokes/Overpass smoke.jpg'),
    'train': require('@/assets/images/map smokes/Train smoke.jpg'),
    'vertigo': require('@/assets/images/map smokes/Vertigo smoke.jpg'),
  };

  function getCategoryImage(category: CategoryWithData, mapName: string | null): any {
    // Check if category is "Nades" (case-insensitive)
    if (category.name.toLowerCase() === 'nades' && mapName) {
      const mapKey = mapName.toLowerCase().trim();
      // Try exact match first
      if (mapSmokeImages[mapKey]) {
        return mapSmokeImages[mapKey];
      }
      // Try to find a match (case-insensitive)
      const matchedKey = Object.keys(mapSmokeImages).find(key => 
        key.toLowerCase() === mapKey || 
        mapKey.includes(key.toLowerCase()) || 
        key.toLowerCase().includes(mapKey)
      );
      if (matchedKey) {
        return mapSmokeImages[matchedKey];
      }
    }
    // Fall back to thumbnail URL or null
    return category.thumbnail ? { uri: category.thumbnail } : null;
  }

  function CategoryCard({ category }: { category: CategoryWithData }) {
    const [hovered, setHovered] = useState(false);
    const iconSize = isLargeScreen ? 26 : 18;
    const titleFont = isLargeScreen ? 22 : 17;
    const categoryImage = getCategoryImage(category, map?.name || null);
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      if (!isWeb) {
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
            friction: 8,
            tension: 40,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.85,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
      }
    };

    const handlePressOut = () => {
      if (!isWeb) {
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            friction: 8,
            tension: 40,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
      }
    };

    const CardWrapper = isWeb ? View : Animated.View;
    const cardStyle = isWeb
      ? [
          styles.categoryCard,
          {
            width: cardWidth,
            height: cardHeight,
            marginHorizontal: isMobile ? width * 0.05 : 10,
            marginBottom: 20,
            transform: [{ scale: hovered ? 1.03 : 1 }],
            opacity: hovered ? 0.98 : 1,
            boxShadow: hovered ? '0 0 18px 2px rgba(250, 204, 21, 0.5)' : '0px 4px 14px rgba(0,0,0,0.4)',
            transition: 'all 0.25s ease',
            cursor: 'pointer',
          } as any,
        ]
      : [
          styles.categoryCard,
          {
            width: cardWidth,
            height: cardHeight,
            marginHorizontal: isMobile ? width * 0.05 : 10,
            marginBottom: 20,
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          } as any,
        ];

    return (
      <Pressable
        onHoverIn={() => isWeb && setHovered(true)}
        onHoverOut={() => isWeb && setHovered(false)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => handleCategoryPress(category)}
      >
        <CardWrapper style={cardStyle}>
        {categoryImage ? (
          <Image 
            source={categoryImage} 
            style={[
              styles.categoryImage,
              hovered && isWeb ? { transform: [{ scale: 1.08 }] } : {},
            ]} 
            resizeMode="cover" 
          />
        ) : (
          <View style={styles.categoryImagePlaceholder}>
            <Text style={styles.placeholderText}>{category.name.substring(0, 2).toUpperCase()}</Text>
          </View>
        )}

        <View style={styles.categoryOverlay}>
          <View style={styles.titleRow}>
            <Text style={[styles.cardTitle, { fontSize: titleFont }]} numberOfLines={1}>
              {category.name}
            </Text>

            {isWeb ? (
              <View style={styles.typeRowInline}>
                {Object.entries(category.videoTypeCounts).map(([type, count]) => (
                  <View key={type} style={styles.typeItemInline}>
                    <Image
                      source={icons[type as keyof typeof icons]}
                      style={[styles.typeIcon, { width: iconSize, height: iconSize }]}
                      resizeMode="contain"
                    />
                    <Text style={styles.typeCount}>{count}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.typeRowInline}>
                <Image
                  source={icons.smoke}
                  style={[styles.typeIcon, { width: 18, height: 18 }]}
                  resizeMode="contain"
                />
                <Text style={styles.typeCount}>{category.totalVideos}</Text>
              </View>
            )}
          </View>
        </View>
        </CardWrapper>
      </Pressable>
    );
  }

  function CalloutCard() {
    const [hovered, setHovered] = useState(false);
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      if (!isWeb) {
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
            friction: 8,
            tension: 40,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.85,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
      }
    };

    const handlePressOut = () => {
      if (!isWeb) {
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            friction: 8,
            tension: 40,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
      }
    };

    const CardWrapper = isWeb ? View : Animated.View;
    const cardStyle = isWeb
      ? [
          styles.categoryCard,
          {
            width: cardWidth,
            height: cardHeight,
            marginHorizontal: isMobile ? width * 0.05 : 10,
            marginBottom: 20,
            transform: [{ scale: hovered ? 1.03 : 1 }],
            opacity: hovered ? 0.98 : 1,
            boxShadow: hovered ? '0 0 18px 2px rgba(250, 204, 21, 0.5)' : '0px 4px 14px rgba(0,0,0,0.4)',
            transition: 'all 0.25s ease',
            cursor: 'pointer',
          } as any,
        ]
      : [
          styles.categoryCard,
          {
            width: cardWidth,
            height: cardHeight,
            marginHorizontal: isMobile ? width * 0.05 : 10,
            marginBottom: 20,
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          } as any,
        ];

    return (
      <Pressable
        onHoverIn={() => isWeb && setHovered(true)}
        onHoverOut={() => isWeb && setHovered(false)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handleCalloutPress}
      >
        <CardWrapper style={cardStyle}>
        <Image
          source={require('@/assets/images/callouts.jpg')}
          style={[
            styles.categoryImage,
            hovered && isWeb ? { transform: [{ scale: 1.08 }] } : {},
          ]}
          resizeMode="cover"
        />
        <View style={styles.categoryOverlay}>
          <View style={styles.titleRow}>
            <Text style={[styles.cardTitle, { fontSize: isLargeScreen ? 22 : 17 }]}>{t('callouts')}</Text>
          </View>
        </View>
        </CardWrapper>
      </Pressable>
    );
  }

  const data = [
    ...categories.map((c) => ({ type: 'category', data: c })),
    { type: 'callout', data: null as any },
  ];

  if (loading)
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  if (error)
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: safePaddingTop }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#fff" />
        </Pressable>
        <Text style={styles.title}>{map?.name} - {t('categories')}</Text>
      </View>

      <FlatList
        data={data}
        renderItem={({ item }) =>
          item.type === 'category' ? (
            <CategoryCard category={item.data as CategoryWithData} />
          ) : (
            <CalloutCard />
          )
        }
        keyExtractor={(_, idx) => String(idx)}
        numColumns={isWeb ? 2 : 1} // ✅ mobile: 1 per row
        key={isWeb ? '2-columns' : '1-column'}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.list,
          { alignItems: 'center', justifyContent: 'center' },
        ]}
        columnWrapperStyle={isWeb ? styles.columnWrapper : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#222128' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#222128' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    gap: 12,
  },
  backButton: { padding: 8 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff' },

  list: { paddingVertical: 28, paddingHorizontal: 8 },
  columnWrapper: { gap: 18, marginBottom: 18, width: '100%', justifyContent: 'center' },

  categoryCard: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0a0a0a',
    position: 'relative',
  },
  categoryImage: { position: 'absolute', width: '100%', height: '100%' },
  categoryImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: { fontSize: 32, fontWeight: 'bold', color: '#666' },
  categoryOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  cardTitle: { color: '#fff', fontWeight: 'bold', flexShrink: 1 },
  typeRowInline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeItemInline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  typeIcon: { width: 20, height: 20 },
  typeCount: { color: '#facc15', fontWeight: '700', fontSize: 14 },
  errorText: { color: '#ff4444', fontSize: 16 },
});
