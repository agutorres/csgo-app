import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
  Pressable,
  ScrollView,
  Linking,
} from 'react-native';
import { useEffect, useState, useRef } from 'react';
import { Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { User } from 'lucide-react-native';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';

type Map = Database['public']['Tables']['maps']['Row'];
interface MapWithStats extends Map {
  total_videos: number;
  status: 'active' | 'inactive';
}

/* ---------------------------- LANDING SECTION ---------------------------- */
function LandingSection() {
  const { width } = useWindowDimensions();
  const isSmall = width < 900;
  const isMedium = width < 1200;

  const handleAppStorePress = async () => {
    const url = 'https://apps.apple.com/app/id6754860016';
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } else {
      try {
        await WebBrowser.openBrowserAsync(url);
      } catch (err) {
        console.error('Error opening URL:', err);
        Linking.openURL(url).catch(() => {});
      }
    }
  };

  return (
    <View style={styles.landingWrapper}>
      <View style={styles.landingContent}>
        {/* Left side: text & store badges */}
        <View
          style={[
            styles.landingTextContainer,
            isSmall && styles.landingTextContainerSmall,
          ]}
        >
          <View style={styles.landingTitleContainer}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={[styles.landingIcon, isSmall && styles.landingIconSmall]}
              resizeMode="contain"
            />
            <Text 
              style={[styles.landingTitle, isSmall && styles.landingTitleSmall]}
              accessibilityRole="header"
            >
              FPS Guide
            </Text>
          </View>

          <Text style={[styles.landingSubtitle, isSmall && styles.landingSubtitleSmall]}>
            The ultimate tool for Counter-Strike 2 players: learn pro-level lineups, execute perfect
            nades, and dominate every map with precision.{' '}
            <Text style={styles.landingHighlight}>Available now on iOS & Android.</Text>
          </Text>

          <View style={[styles.storeButtons, isSmall && styles.storeButtonsSmall]}>
            {Platform.OS === 'web' ? (
              <div
                style={{
                  display: 'inline-block',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease',
                }}
                onClick={() => window.open('https://apps.apple.com/app/id6754860016', '_blank', 'noopener,noreferrer')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <img
                  src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
                  alt="Download on the App Store"
                  style={{
                    width: '160px',
                    height: '50px',
                    display: 'block',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            ) : (
              <TouchableOpacity
                onPress={handleAppStorePress}
                activeOpacity={0.7}
                style={styles.storeBadgePressable}
              >
                <Image
                  source={{
                    uri: 'https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg',
                  }}
                  style={styles.storeBadge}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            )}
            <Image
              source={{
                uri: 'https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg',
              }}
              style={styles.storeBadge}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Right side: app mockup */}
        {!isSmall && (
          <View style={styles.landingHeroContainer}>
            <Image
              source={require('@/assets/images/image4-left.png')}
              style={[styles.landingHero, isMedium && styles.landingHeroMedium]}
              resizeMode="contain"
            />
          </View>
        )}
      </View>

      {/* Centered ELO bar */}
      <View style={styles.eloAnnouncement}>
        <Image
          source={require('@/assets/images/elo.png')}
          style={[styles.eloBar, isSmall && styles.eloBarSmall]}
          resizeMode="contain"
        />
        <Text style={[styles.eloText, isSmall && styles.eloTextSmall]}>
          Master CS2 grenade lineups to boost your ELO ranking. Learn professional smokes, flashes, and utility setups to climb to <Text style={styles.eloHighlight}>30,000+ ELO</Text> and advance to higher FACEIT tiers. Perfect your gameplay with expert lineups designed for competitive Counter-Strike 2 matches.
        </Text>
      </View>
    </View>
  );
}

/* ---------------------------- MAIN MAP SCREEN ---------------------------- */
export default function MapsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [maps, setMaps] = useState<MapWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  const { width } = useWindowDimensions();
  const pathname = usePathname();

  const isWeb = Platform.OS === 'web';
  const numColumns = isWeb && width > 1024 ? 3 : 2;
  const safePaddingTop = Platform.OS === 'ios' ? Math.max(insets.top + 20, 60) : 60;

  // SEO: Update document title and meta tags for web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'FPS Guide - Master CS2 Grenade Lineups | Professional Counter-Strike 2 Training';
      
      // Update meta description
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', 'The ultimate tool for Counter-Strike 2 players. Learn pro-level grenade lineups, execute perfect smokes and flashes, and dominate every map. Master CS2 to climb to 30,000+ ELO.');
    }
  }, [pathname]);

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

      const typedMaps = (mapsData || []) as Map[];
      
      const mapsWithStats: MapWithStats[] = await Promise.all(
        typedMaps.map(async (map) => {
          const { count, error: videoError } = await supabase
            .from('videos')
            .select('*', { count: 'exact', head: true })
            .eq('map_id', map.id);

          if (videoError) console.warn(videoError.message);

          return {
            ...map,
            total_videos: count || 0,
            status: ((map as any).status || 'active') as 'active' | 'inactive',
          } as MapWithStats;
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

  const isSmallScreen = width < 500;

  function MapCard({
    item,
    isWeb,
    isWide,
  }: {
    item: MapWithStats;
    isWeb: boolean;
    isWide: boolean;
  }) {
    const [hovered, setHovered] = useState(false);

    const cardWidth = isWide ? '30%' : isSmallScreen ? '100%' : '48%';

    return (
      <Pressable
        onHoverIn={() => isWeb && setHovered(true)}
        onHoverOut={() => isWeb && setHovered(false)}
        onPress={() => router.push(`/map/categories/${item.id}`)}
        style={[
          styles.mapCard,
          {
            width: cardWidth,
            height: isWide ? 240 : isSmallScreen ? 200 : 170,
            margin: isWide ? 6 : 8,
            transform: [{ scale: hovered ? 1.03 : 1 }],
            opacity: hovered ? 0.98 : 1,
            boxShadow: hovered && isWeb ? '0 0 18px 2px rgba(250, 204, 21, 0.5)' : 'none',
            ...(isWeb ? { cursor: 'pointer' } : {}),
          } as any,
        ]}
      >
        <Image
          source={{ uri: item.thumbnail_url }}
          style={[styles.mapImage, hovered && isWeb ? { transform: [{ scale: 1.08 }] } : {}]}
          resizeMode="cover"
        />
        <View style={styles.mapOverlay}>
          <View style={styles.mapHeader}>
            <Text style={[styles.mapName, isWide && styles.mapNameWeb]}>{item.name}</Text>
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
        <TouchableOpacity style={styles.retryButton} onPress={fetchMaps}>
          <Text style={styles.retryText}>{t('retry')}</Text>
        </TouchableOpacity>
      </View>
    );

  return (
    <View style={{ flex: 1, backgroundColor: '#222128' }}>
      {/* Header - using relative positioning to avoid lag */}
      {Platform.OS === 'web' ? (
        <View style={styles.headerWeb}>
          <View style={styles.headerContent}>
            <View style={styles.logoPlaceholder} />
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <User size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={[styles.header, { paddingTop: safePaddingTop }]}>
          <View style={styles.headerContent}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <User size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {isWeb && <LandingSection />}

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'active' && styles.activeTab]}
            onPress={() => setActiveTab('active')}
          >
            <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
              {t('activeMaps')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'inactive' && styles.activeTab]}
            onPress={() => setActiveTab('inactive')}
          >
            <Text style={[styles.tabText, activeTab === 'inactive' && styles.activeTabText]}>
              {t('inactiveMaps')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.listContainer, isWeb && styles.listContainerWeb, styles.mapsGrid]}>
          {filteredMaps.map((item) => (
            <MapCard 
              key={item.id} 
              item={item} 
              isWeb={isWeb} 
              isWide={isWeb && width > 1024} 
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

/* ---------------------------- STYLES ---------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#222128' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#222128' },
  scrollContent: { paddingBottom: 40 },

  // Header - optimized to prevent lag (mobile - no border)
  header: {
    backgroundColor: '#222128',
    paddingBottom: 12,
  },
  headerWeb: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backdropFilter: 'blur(10px)',
    backgroundColor: 'rgba(34, 33, 40, 0.95)',
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: Platform.OS === 'web' ? 4 : 8,
  },
  logo: {
    width: 80,
    height: 80,
  },
  logoPlaceholder: {
    width: 52,
    height: 52,
  },
  profileButton: {
    padding: Platform.OS === 'web' ? 12 : 10,
    borderRadius: 24,
    backgroundColor: '#2a2a2a',
    minWidth: Platform.OS === 'web' ? 52 : 44,
    minHeight: Platform.OS === 'web' ? 52 : 44,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        ':hover': {
          backgroundColor: '#3a3a3a',
          transform: 'scale(1.05)',
        },
      },
    }),
  },

  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
    ...Platform.select({
      web: {
        justifyContent: 'center',
        maxWidth: 600,
        alignSelf: 'center',
        width: '100%',
      },
    }),
  },
  tab: {
    ...Platform.select({
      web: {
        flex: 0,
        minWidth: 180,
        paddingHorizontal: 32,
      },
      default: {
        flex: 1,
      },
    }),
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#1a1a20',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a30',
  },
  activeTab: { 
    backgroundColor: '#facc15',
    borderColor: '#facc15',
  },
  tabText: { 
    fontSize: Platform.OS === 'web' ? 16 : 14, 
    fontWeight: '600', 
    color: '#999' 
  },
  activeTabText: { 
    color: '#000',
    fontWeight: '700',
  },
  listContainer: { paddingHorizontal: 10 },
  listContainerWeb: { paddingHorizontal: 20 },
  mapsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    ...Platform.select({
      web: {
        justifyContent: 'space-around',
      },
      default: {
        justifyContent: 'space-between',
      },
    }),
  },
  row: { justifyContent: 'space-between' },
  rowWeb: { justifyContent: 'space-around' },
  mapCard: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a20',
  },
  mapImage: { width: '100%', height: '100%' },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    padding: 12,
  },
  mapHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
  videoCountContainerWeb: { paddingHorizontal: 10, paddingVertical: 6 },
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

  /* Landing section */
  landingWrapper: {
    backgroundColor: '#222128',
    paddingVertical: Platform.OS === 'web' ? 40 : 40,
    paddingHorizontal: Platform.OS === 'web' ? 40 : 20,
    alignItems: 'center',
    width: '100%',
  },
  landingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 60,
    maxWidth: 1400,
    width: '100%',
    marginBottom: Platform.OS === 'web' ? 40 : 60,
  },
  landingTextContainer: {
    flex: 1,
    minWidth: 300,
    maxWidth: 600,
    alignItems: 'flex-start',
  },
  landingTextContainerSmall: {
    alignItems: 'center',
    maxWidth: '100%',
    minWidth: '100%',
  },
  landingTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  landingIcon: {
    width: Platform.OS === 'web' ? 120 : 80,
    height: Platform.OS === 'web' ? 120 : 80,
  },
  landingIconSmall: {
    width: 72,
    height: 72,
  },
  landingTitle: {
    fontSize: Platform.OS === 'web' ? 72 : 48,
    fontWeight: '900',
    color: '#facc15',
    letterSpacing: -1,
    textShadowColor: 'rgba(250, 204, 21, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  landingTitleSmall: {
    fontSize: 40,
  },
  landingSubtitle: {
    color: '#ccc',
    fontSize: Platform.OS === 'web' ? 20 : 16,
    lineHeight: Platform.OS === 'web' ? 32 : 24,
    marginBottom: 32,
    textAlign: 'left',
  },
  landingSubtitleSmall: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
  landingHighlight: {
    color: '#facc15',
    fontWeight: '600',
  },
  storeButtons: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
    marginTop: 8,
  },
  storeButtonsSmall: {
    justifyContent: 'center',
    width: '100%',
  },
  storeBadge: {
    width: 160,
    height: 50,
  },
  storeBadgePressable: {
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'transform 0.2s ease',
        ':hover': {
          transform: 'scale(1.05)',
        },
      },
    }),
  },
  storeBadgePressed: {
    opacity: 0.8,
  },
  landingHeroContainer: {
    flex: 1,
    minWidth: 300,
    maxWidth: 600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  landingHero: {
    width: '100%',
    maxWidth: 550,
    height: 450,
    aspectRatio: 16 / 9,
  },
  landingHeroMedium: {
    maxWidth: 450,
    height: 360,
  },
  eloAnnouncement: {
    alignItems: 'center',
    marginTop: Platform.OS === 'web' ? 30 : 40,
    paddingHorizontal: 20,
    width: '100%',
  },
  eloBar: {
    width: '100%',
    maxWidth: 700,
    height: 130,
    marginBottom: 24,
  },
  eloBarSmall: {
    maxWidth: '100%',
    height: 100,
  },
  eloText: {
    color: '#ccc',
    fontSize: Platform.OS === 'web' ? 19 : 16,
    textAlign: 'center',
    maxWidth: 900,
    lineHeight: Platform.OS === 'web' ? 32 : 24,
    fontWeight: '400',
  },
  eloTextSmall: {
    fontSize: 14,
    lineHeight: 22,
  },
  eloHighlight: {
    color: '#facc15',
    fontWeight: '700',
  },
});
