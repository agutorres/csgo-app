import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Image,
  Platform,
  Alert,
  useWindowDimensions,
  Animated,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Database, Difficulty } from '@/types/database';
import { ChevronLeft, ChevronRight, ChevronDown, Star, Diamond } from 'lucide-react-native';
import VideoExpandModal from '@/components/VideoExpandModal';
import ImageViewerModal from '@/components/ImageViewerModal';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/lib/i18n/LanguageContext';

type Video = Database['public']['Tables']['videos']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];
type Map = Database['public']['Tables']['maps']['Row'];

interface VideoDetail {
  id: string;
  video_id: string;
  name: string;
  image_url: string;
}

type VideoFilter = 'all' | 'essentials' | 'favorites';

export default function CategorySectionsScreen() {
  const { categoryId, mapId } = useLocalSearchParams<{ categoryId: string; mapId: string }>();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { width } = useWindowDimensions();
  const [category, setCategory] = useState<Category | null>(null);
  const [map, setMap] = useState<Map | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [videoDetailsMap, setVideoDetailsMap] = useState<Record<string, VideoDetail[]>>({});
  const [loading, setLoading] = useState(true);
  const [videosLoading, setVideosLoading] = useState(false);
  const [selectedSide, setSelectedSide] = useState<'T' | 'CT' | null>(null);
  const [selectedVideoType, setSelectedVideoType] = useState<'nade' | 'smoke' | 'fire' | 'flash' | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [expandModalVisible, setExpandModalVisible] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [videoFilter, setVideoFilter] = useState<VideoFilter>('all');
  
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user } = useAuth();
  
  // Calculate safe padding for iOS
  const safePaddingTop = Platform.OS === 'ios' ? Math.max(insets.top, 48) : 48;

  useEffect(() => {
    if (categoryId && mapId) {
      fetchData();
    }
  }, [categoryId, mapId]);

  async function fetchData() {
    try {
      setLoading(true);

      // Fetch map
      const { data: mapData, error: mapError } = await supabase
        .from('maps')
        .select('*')
        .eq('id', mapId)
        .single();

      if (mapError) throw mapError;
      setMap(mapData);

      // Fetch category
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single();

      if (categoryError) throw categoryError;
      setCategory(categoryData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }

  const fetchVideos = useCallback(async () => {
    if (!selectedSide || !selectedVideoType || !mapId) {
      setVideos([]);
      setVideoDetailsMap({});
      setVideosLoading(false);
      return;
    }
    
    try {
      setVideosLoading(true);
      // Clear videos immediately when starting to fetch
      setVideos([]);
      setVideoDetailsMap({});
      
      const { data: videosData, error: videosError } = await supabase
        .from('videos')
        .select(`*`)
        .eq('video_type', selectedVideoType)
        .eq('side', selectedSide)
        .eq('map_id', mapId)
        .order('created_at', { ascending: false });
    
      if (videosError) throw videosError;
      const typedVideos = (videosData || []) as Video[];
      setVideos(typedVideos);

      // Fetch video details for all videos
      if (typedVideos.length > 0) {
        const videoIds = typedVideos.map(v => v.id);
        const { data: detailsData, error: detailsError } = await supabase
          .from('video_details')
          .select('id, video_id, name, image_url')
          .in('video_id', videoIds);

        if (!detailsError && detailsData) {
          // Group video details by video_id
          const detailsMap: Record<string, VideoDetail[]> = {};
          (detailsData as VideoDetail[]).forEach((detail: VideoDetail) => {
            if (!detailsMap[detail.video_id]) {
              detailsMap[detail.video_id] = [];
            }
            detailsMap[detail.video_id].push(detail);
          });
          setVideoDetailsMap(detailsMap);
        }
      }
    } catch (err) {
      console.error('Error fetching videos:', err);
    } finally {
      setVideosLoading(false);
    }
  }, [selectedSide, selectedVideoType, mapId]);

  useEffect(() => {
    // Fetch videos when side and video type are selected
    fetchVideos();
  }, [fetchVideos]);

  function handleSidePress(side: 'T' | 'CT') {
    if (selectedSide === side) {
      setSelectedSide(null);
      setSelectedVideoType(null);
    } else {
      setSelectedSide(side);
      setSelectedVideoType(null);
    }
  }

  function handleVideoTypePress(videoType: 'nade' | 'smoke' | 'fire' | 'flash') {
    if (selectedVideoType === videoType) {
      setSelectedVideoType(null);
    } else {
      setSelectedVideoType(videoType);
    }
  }

  function handleVideoPress(video: Video) {
    setSelectedVideo(video);
    setExpandModalVisible(true);
  }

  function handleWatchVideo(videoId: string) {
    router.push(`/video/${videoId}`);
  }

  function getVideosForSideAndType(side: 'T' | 'CT', videoType: 'nade' | 'smoke' | 'fire' | 'flash') {
    let filteredVideos = videos.filter(v => 
      (v as any).side === side && 
      (v as any).video_type === videoType
    );

    // Apply additional filters
    if (videoFilter === 'essentials') {
      filteredVideos = filteredVideos.filter(v => (v as any).essential === true);
    } else if (videoFilter === 'favorites') {
      filteredVideos = filteredVideos.filter(v => isFavorite(v.id));
    }

    return filteredVideos;
  }

  const videoTypes = [
    { type: 'smoke' as const, name: 'Smoke', image: require('@/assets/images/smoke.png') },
    { type: 'nade' as const, name: 'Grenade', image: require('@/assets/images/nade.png') },
    { type: 'fire' as const, name: 'Molotov', image: require('@/assets/images/fire.png') },
    { type: 'flash' as const, name: 'Flash', image: require('@/assets/images/flash.png') },
  ];

  function getDifficultyColor(difficulty: Difficulty) {
    switch (difficulty) {
      case 'easy':
        return '#4ade80';
      case 'mid':
        return '#fbbf24';
      case 'hard':
        return '#f87171';
      default:
        return '#fff';
    }
  }

  // Determine translucent color for grenade container
  const grenadeContainerColor =
  selectedSide === 'T'
    ? 'rgba(245, 158, 11, 0.4)' // orange with opacity
    : selectedSide === 'CT'
    ? 'rgba(59, 130, 246, 0.4)' // blue with opacity
    : '#2a2a2a';

  function VideoCard({ video }: { video: Video }) {
    const [hovered, setHovered] = useState(false);
    const isWeb = Platform.OS === 'web';
    const scaleAnim = useRef(new Animated.Value(1)).current;
    
    // Determine image URL: prefer map_image, then "End Point" video detail, then map thumbnail
    let mapImageUrl = (video as any).map_image;
    if (!mapImageUrl) {
      const videoDetails = videoDetailsMap[video.id];
      if (videoDetails) {
        const endPointDetail = videoDetails.find((detail: VideoDetail) => 
          detail.name.toLowerCase() === 'end point' || detail.name === 'End Point'
        );
        if (endPointDetail && endPointDetail.image_url) {
          mapImageUrl = endPointDetail.image_url;
        }
      }
    }
    if (!mapImageUrl) {
      mapImageUrl = map?.thumbnail_url;
    }
    const isVideoFavorite = isFavorite(video.id);

    const handlePressIn = () => {
      if (!isWeb) {
        Animated.spring(scaleAnim, {
          toValue: 0.96,
          useNativeDriver: true,
          friction: 6,
          tension: 100,
        }).start();
      }
    };

    const handlePressOut = () => {
      if (!isWeb) {
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 6,
          tension: 100,
        }).start();
      }
    };

    const cardContent = (
      <>
        {mapImageUrl && (
          <Image
            source={{ uri: mapImageUrl }}
            style={[styles.videoThumbnail, hovered && isWeb ? { transform: [{ scale: 1.08 }] } : {}]}
            resizeMode="cover"
          />
        )}
        <View style={styles.videoOverlay}>
          <View style={styles.playButton}>
            <View style={styles.playIcon} />
          </View>
          <Text style={styles.videoTitle} numberOfLines={2}>
            {video.title}
          </Text>
        </View>
        
        {/* Favorite Star */}
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={(e) => {
            e.stopPropagation();
            if (!user) {
              Alert.alert(t('signIn'), t('signInToComment'));
              return;
            }
            toggleFavorite(video.id);
          }}
        >
          <Star
            size={20}
            color={isVideoFavorite ? '#fbbf24' : '#fff'}
            fill={isVideoFavorite ? '#fbbf24' : 'none'}
          />
        </TouchableOpacity>
        
        {/* Essential Badge */}
        {(video as any).essential && (
          <View style={styles.essentialBadge}>
            <Diamond size={14} color="#3b82f6" fill="#3b82f6" />
          </View>
        )}

        {/* Difficulty Badge - Bottom Left */}
        {video.difficulty && (
          <View style={[
            styles.difficultyBadge,
            Platform.OS !== 'web' && styles.difficultyBadgeMobile,
            { backgroundColor: getDifficultyColor(video.difficulty) }
          ]}>
            <Text style={[
              styles.difficultyText,
              Platform.OS !== 'web' && styles.difficultyTextMobile
            ]}>{video.difficulty.toUpperCase()}</Text>
          </View>
        )}
      </>
    );

    if (isWeb) {
      return (
        <Pressable
          onHoverIn={() => setHovered(true)}
          onHoverOut={() => setHovered(false)}
          onPress={() => handleVideoPress(video)}
          style={[
            styles.videoCard,
            {
              transform: [{ scale: hovered ? 1.03 : 1 }],
              opacity: hovered ? 0.98 : 1,
              boxShadow: hovered ? '0 0 18px 2px rgba(250, 204, 21, 0.5)' : 'none',
              cursor: 'pointer',
            } as any,
          ]}
        >
          {cardContent}
        </Pressable>
      );
    }

    return (
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => handleVideoPress(video)}
        style={styles.videoCard}
      >
        <Animated.View
          style={{
            flex: 1,
            transform: [{ scale: scaleAnim }],
          }}
        >
          {cardContent}
        </Animated.View>
      </Pressable>
    );
  }

  function renderVideoItem(video: Video) {
    return <VideoCard video={video} />;
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: safePaddingTop }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{map?.name} - {category?.name}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

        {/* T/CT Side Selection */}
        <View style={styles.sideSelectionContainer}>
            <Text style={styles.sectionLabel}>{t('selectSide')}</Text>
        
          <View style={styles.sideButtons}>
              {/* T Side */}
              <TouchableOpacity
                style={[
                  styles.sideButton,
                  selectedSide === 'T' && [styles.sideButtonActive, { backgroundColor: '#f59e0b' }],
                ]}
                onPress={() => handleSidePress('T')}
                activeOpacity={0.8}
              >
                {/* Image fills the square */}
                <Image
                  source={require('@/assets/images/t.png')}
                  style={styles.sideImage}
                  resizeMode="cover"
                />
          
                {/* Footer: Text + Chevron */}
                <View style={styles.sideFooter}>
                  <Text
                    style={[
                      styles.sideText,
                      selectedSide === 'T' && styles.sideTextActive,
                    ]}
                  >
                    {t('tSide')}
                  </Text>
                  {selectedSide === 'T' ? (
                    <ChevronDown size={18} color="#fff" />
                  ) : (
                    <ChevronRight size={18} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>
          
              {/* CT Side */}
              <TouchableOpacity
                style={[
                  styles.sideButton,
                  selectedSide === 'CT' && [styles.sideButtonActive, { backgroundColor: '#3b82f6' }],
                ]}
                onPress={() => handleSidePress('CT')}
                activeOpacity={0.8}
              >
                <Image
                  source={require('@/assets/images/ct.png')}
                  style={styles.sideImage}
                  resizeMode="cover"
                />
          
                <View style={styles.sideFooter}>
                  <Text
                    style={[
                      styles.sideText,
                      selectedSide === 'CT' && styles.sideTextActive,
                    ]}
                  >
                    {t('ctSide')}
                  </Text>
                  {selectedSide === 'CT' ? (
                    <ChevronDown size={18} color="#fff" />
                  ) : (
                    <ChevronRight size={18} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>

        {/* Video Type Selection - shown when side is selected */}
        {selectedSide && (
          <View style={[
            styles.videoTypeSelectionContainer,
            { backgroundColor: grenadeContainerColor },
          ]}>
            <Text style={styles.sectionLabel}>{t('selectVideoType')}</Text>
            <View style={styles.videoTypeGrid}>
              {videoTypes.map((videoType) => (
                <TouchableOpacity
                  key={videoType.type}
                  style={[
                    styles.videoTypeButton,
                    selectedVideoType === videoType.type && styles.videoTypeButtonActive,
                  ]}
                  onPress={() => handleVideoTypePress(videoType.type)}
                  activeOpacity={0.8}
                >
                  <View style={styles.videoTypeImageWrapper}>
                    <Image
                      source={videoType.image}
                      style={styles.videoTypeImage}
                      resizeMode="contain"
                    />
                  </View>
                  <Text
                    style={[
                      styles.videoTypeName,
                      selectedVideoType === videoType.type && styles.videoTypeNameActive,
                      { fontSize: width < 400 ? 10 : width < 600 ? 12 : 14 },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit={Platform.OS !== 'web'}
                  >
                    {videoType.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}


        {/* Videos Grid - shown when video type is selected */}
        {selectedSide && selectedVideoType && (
          <View style={styles.videosContainer}>
            <View style={styles.videosHeader}>
              <Text style={styles.sectionLabel}>
                {selectedSide} - {videoTypes.find(vt => vt.type === selectedVideoType)?.name} Lineups
              </Text>
              
              {/* Filter Buttons */}
              <View style={styles.filterButtons}>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    videoFilter === 'all' && styles.filterButtonActive,
                  ]}
                  onPress={() => setVideoFilter('all')}
                >
                  <Text style={[
                    styles.filterButtonText,
                    videoFilter === 'all' && styles.filterButtonTextActive,
                  ]}>
                    {t('all')}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    videoFilter === 'essentials' && styles.filterButtonActive,
                  ]}
                  onPress={() => setVideoFilter('essentials')}
                >
                  <View style={styles.filterButtonContent}>
                    <Diamond
                      size={14}
                      color={videoFilter === 'essentials' ? 'none' : '#ccc'}
                      fill={videoFilter === 'essentials' ? '#ccc' : '#3b82f6'}
                    />
                  <Text style={[
                    styles.filterButtonText,
                    videoFilter === 'essentials' && styles.filterButtonTextActive,
                  ]}>
                    {t('essentials')}
                  </Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    videoFilter === 'favorites' && styles.filterButtonActive,
                  ]}
                  onPress={() => setVideoFilter('favorites')}
                >
                  <View style={styles.filterButtonContent}>
                    <Star
                      size={14}
                      color={videoFilter === 'favorites' ? '#fbbf24' : '#fbbf24'}
                      fill={videoFilter === 'favorites' ? '#fbbf24' : '#fbbf24'}
                    />
                  <Text style={[
                    styles.filterButtonText,
                    videoFilter === 'favorites' && styles.filterButtonTextActive,
                  ]}>
                    {t('favorites')}
                  </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.videoGrid}>
              {videosLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#f59e0b" />
                  <Text style={styles.loadingText}>{t('loadingVideos')}</Text>
                </View>
              ) : getVideosForSideAndType(selectedSide, selectedVideoType).length > 0 ? (
                getVideosForSideAndType(selectedSide, selectedVideoType).map((video) => (
                  <View key={video.id} style={styles.videoGridItem}>
                    {renderVideoItem(video)}
                  </View>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No videos found</Text>
                </View>
              )}
            </View>
          </View>
        )}

      </ScrollView>

      <VideoExpandModal
        visible={expandModalVisible && !imageViewerVisible}
        onClose={() => setExpandModalVisible(false)}
        video={selectedVideo as any}
        onWatchVideo={handleWatchVideo}
        onImagePress={(imageUrl: string) => {
          setSelectedImageUrl(imageUrl);
          setImageViewerVisible(true);
        }}
      />

      {imageViewerVisible && selectedImageUrl && (
        <ImageViewerModal
          visible={imageViewerVisible}
          imageUrl={selectedImageUrl}
          onClose={() => {
            setImageViewerVisible(false);
            setSelectedImageUrl(null);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sideImage: {
    width: '100%',
    height: '80%', // image fills most of the square
  },
  sideFooter: {
    height: '20%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sideSelectionContainer: {
    marginTop: 20,
  },
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionsContainer: {
    marginBottom: 24,
  },
  sectionCard: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    alignItems: 'center',
    minHeight: 100,
  },
  sectionThumbnail: {
    width: 120,
    height: 100,
  },
  sectionThumbnailPlaceholder: {
    width: 120,
    height: 100,
    backgroundColor: '#1a1a20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionPlaceholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
  },
  sectionCardContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  sectionCardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  sectionCardCount: {
    fontSize: 14,
    color: '#999',
  },
  sectionChevron: {
    marginRight: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
  },
  sideButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  sideButton: {
    width: 120,
    aspectRatio: 1, // makes it a square
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1f2937',
  },
  sideButtonActive: {
    transform: [{ scale: 1.02 }],
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  sideIcon: {
    width: 32,
    height: 32,
  },
  sideText: {
    color: '#ddd',
    fontSize: 14,
    fontWeight: '600',
  },
  sideTextActive: {
    color: '#fff',
  },
  videoTypeSelectionContainer: {
    marginTop: 24,
    marginBottom: 24,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  
  videoTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  
  videoTypeButton: {
    width: Platform.OS === 'web' ? '10%' : '20%',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 5,
    borderRadius: 12,
    backgroundColor: '#1f1f1f',
    borderWidth: 2,
    borderColor: '#2e2e2e',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  
  videoTypeButtonActive: {
    borderColor: '#f59e0b',
    backgroundColor: '#292929',
    transform: [{ scale: 1.05 }],
  },
  
  videoTypeImageWrapper: {
    width: 64,
    height: 64,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#3a3a3a',
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  
  videoTypeImage: {
    width: '100%',
    height: '100%',
    // Remove tintColor so PNG keeps its original color
    tintColor: undefined,
  },
  
  videoTypeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ccc',
    textAlign: 'center',
  },
  
  videoTypeNameActive: {
    color: '#f59e0b',
  },
  
  videoTypeChevron: {
    marginTop: 4,
  },
  videosContainer: {
    marginBottom: 24,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
  },
  videosHeader: {
    marginBottom: 16,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#353535',
    borderWidth: 1,
    borderColor: '#555',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ccc',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  videoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'flex-start',
  },
  videoGridItem: {
    width: Platform.OS === 'web' ? '30%' : '48%',
    aspectRatio: 16 / 9,
  },
  videoCard: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#353535',
    position: 'relative',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  playIcon: {
    width: 0,
    height: 0,
    borderLeftWidth: 16,
    borderLeftColor: '#fff',
    borderTopWidth: 10,
    borderTopColor: 'transparent',
    borderBottomWidth: 10,
    borderBottomColor: 'transparent',
    marginLeft: 4,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  essentialBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  essentialText: {
    fontSize: 12,
    color: '#000',
  },
  difficultyBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  difficultyBadgeMobile: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    bottom: 6,
    left: 6,
    opacity: 0.85,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000',
  },
  difficultyTextMobile: {
    fontSize: 8,
    fontWeight: '700',
    marginTop: -1,
  },
  loadingContainer: {
    width: '100%',
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    width: '100%',
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
});
