import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Database, Difficulty } from '@/types/database';
import { ChevronLeft, ChevronRight, ChevronDown, Play, Users, Shield, Info } from 'lucide-react-native';
import VideoExpandModal from '@/components/VideoExpandModal';
import ImageViewerModal from '@/components/ImageViewerModal';

type Video = Database['public']['Tables']['videos']['Row'];
type Map = Database['public']['Tables']['maps']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];
type CategorySection = Database['public']['Tables']['category_sections']['Row'];


export default function MapVideosScreen() {
  const { id, categoryId, side, sectionId } = useLocalSearchParams<{ 
    id: string; 
    categoryId?: string; 
    side?: 'T' | 'CT'; 
    sectionId?: string;
  }>();
  const [map, setMap] = useState<Map | null>(null);
  const [categorySection, setCategorySection] = useState<CategorySection | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [expandModalVisible, setExpandModalVisible] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [selectedSide, setSelectedSide] = useState<'T' | 'CT' | null>(null);
  const [expandedVideoTypes, setExpandedVideoTypes] = useState<Set<'nade' | 'smoke' | 'fire' | 'flash'>>(new Set());

  useEffect(() => {
    if (id && categoryId && sectionId) {
      fetchMapAndVideos();
    }
  }, [id, categoryId, sectionId]);

  async function fetchMapAndVideos() {
    try {
      setLoading(true);
      setError(null);

      // Fetch map data
      const { data: mapData, error: mapError } = await supabase
        .from('maps')
        .select('*')
        .eq('id', id)
        .single();

      if (mapError) throw mapError;
      setMap(mapData);

      // Fetch category section
      const { data: sectionData, error: sectionError } = await supabase
        .from('category_sections')
        .select('*')
        .eq('id', sectionId!)
        .single();

      if (sectionError) throw sectionError;
      setCategorySection(sectionData);

      // Fetch all videos for this section (both T and CT)
      const { data: videosData, error: videosError } = await supabase
        .from('videos')
        .select('*')
        .eq('map_id', id)
        .eq('category_section_id', sectionId!)
        .in('side', ['T', 'CT'])
        .order('created_at', { ascending: false });

      if (videosError) throw videosError;
      setVideos(videosData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load map and videos');
    } finally {
      setLoading(false);
    }
  }

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

  const handleVideoPress = (video: Video) => {
    setSelectedVideo(video);
    setExpandModalVisible(true);
  };

  const handleWatchVideo = (videoId: string) => {
    router.push(`/video/${videoId}`);
  };

  function renderVideoItem({ item }: { item: Video }) {
    const mapImageUrl = (item as any).map_image || map?.thumbnail_url;
    
    return (
      <TouchableOpacity
        style={styles.videoCard}
        onPress={() => handleVideoPress(item)}>
        {mapImageUrl && (
          <Image
            source={{ uri: mapImageUrl }}
            style={styles.videoThumbnail}
            resizeMode="cover"
          />
        )}
        <View style={styles.videoOverlay}>
          <Text style={styles.videoTitle} numberOfLines={2}>
            {item.title}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  if (!id || !categoryId || !sectionId) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Missing required parameters</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (error || !map || !categorySection) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Map or section not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Group videos by side and video type
  const videosBySide = {
    T: videos.filter(v => (v as any).side === 'T'),
    CT: videos.filter(v => (v as any).side === 'CT'),
  };

  // Video type options with their images
  const videoTypes = [
    { type: 'nade' as const, name: 'Nade', image: require('@/assets/images/nade.png') },
    { type: 'smoke' as const, name: 'Smoke', image: require('@/assets/images/smoke.png') },
    { type: 'fire' as const, name: 'Fire', image: require('@/assets/images/fire.png') },
    { type: 'flash' as const, name: 'Flash', image: require('@/assets/images/flash.png') },
  ];

  function toggleVideoType(videoType: 'nade' | 'smoke' | 'fire' | 'flash') {
    setExpandedVideoTypes(prev => {
      const next = new Set(prev);
      if (next.has(videoType)) {
        next.delete(videoType);
      } else {
        next.add(videoType);
      }
      return next;
    });
  }

  function getVideosForSideAndType(side: 'T' | 'CT', videoType: 'nade' | 'smoke' | 'fire' | 'flash') {
    return videosBySide[side].filter(video => (video as any).video_type === videoType);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{categorySection.name}</Text>
          <Text style={styles.subtitle}>{videos.length} total videos</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.listContainer}>
        {/* Side Selection */}
        <View style={styles.sideSelectionContainer}>
          <Text style={styles.sectionLabel}>Select Side</Text>
          <View style={styles.sideButtons}>
            <TouchableOpacity
              style={[styles.sideSelectionButton, selectedSide === 'T' && styles.sideSelectionButtonActive]}
              onPress={() => setSelectedSide(selectedSide === 'T' ? null : 'T')}
            >
              <Image
                source={require('@/assets/images/t.png')}
                style={styles.sideSelectionIcon}
                resizeMode="contain"
              />
              <Text style={[styles.sideSelectionText, selectedSide === 'T' && styles.sideSelectionTextActive]}>
                T Side
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sideSelectionButton, selectedSide === 'CT' && styles.sideSelectionButtonActive]}
              onPress={() => setSelectedSide(selectedSide === 'CT' ? null : 'CT')}
            >
              <Image
                source={require('@/assets/images/ct.png')}
                style={styles.sideSelectionIcon}
                resizeMode="contain"
              />
              <Text style={[styles.sideSelectionText, selectedSide === 'CT' && styles.sideSelectionTextActive]}>
                CT Side
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Video Types Tree for each selected side */}
        {(selectedSide === 'T' || selectedSide === 'CT') && (
          <View style={styles.videoTypeTreeContainer}>
            <Text style={styles.sectionLabel}>{selectedSide} Side Videos</Text>
            {videoTypes.map((videoType) => {
              const typeVideos = getVideosForSideAndType(selectedSide!, videoType.type);
              const isExpanded = expandedVideoTypes.has(videoType.type);
              const hasVideos = typeVideos.length > 0;

              if (!hasVideos) return null;

              // Separate essential and regular videos
              const essentialVideos = typeVideos.filter(v => (v as any).essential === true);
              const regularVideos = typeVideos.filter(v => (v as any).essential !== true);

              return (
                <View key={videoType.type} style={styles.videoTypeTreeItem}>
                  <TouchableOpacity
                    style={styles.videoTypeHeader}
                    onPress={() => toggleVideoType(videoType.type)}
                  >
                    <View style={styles.videoTypeHeaderLeft}>
                      <Image
                        source={videoType.image}
                        style={styles.videoTypeTreeIcon}
                        resizeMode="contain"
                      />
                      <Text style={styles.videoTypeTreeName}>{videoType.name}</Text>
                      <Text style={styles.videoTypeTreeCount}>({typeVideos.length})</Text>
                    </View>
                    {isExpanded ? <ChevronDown size={20} color="#fff" /> : <ChevronRight size={20} color="#fff" />}
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.videoTypeContent}>
                      {essentialVideos.length > 0 && (
                        <View style={styles.essentialSection}>
                          <View style={styles.essentialHeader}>
                            <Text style={styles.essentialTitle}>⭐ Essential</Text>
                          </View>
                          <View style={styles.videoGrid}>
                            {essentialVideos.map((video) => (
                              <View key={video.id} style={styles.videoGridItem}>
                                {renderVideoItem({ item: video })}
                              </View>
                            ))}
                          </View>
                        </View>
                      )}

                      {regularVideos.length > 0 && (
                        <View style={styles.videosSection}>
                          <View style={styles.videoGrid}>
                            {regularVideos.map((video) => (
                              <View key={video.id} style={styles.videoGridItem}>
                                {renderVideoItem({ item: video })}
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {(!selectedSide && videos.length === 0) && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Select a side to view videos</Text>
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

      {/* Image Viewer at root level - outside VideoExpandModal hierarchy */}
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
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#1a1a1a',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerContent: {
    flex: 1,
  },
  sideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerSideIcon: {
    width: 24,
    height: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    gap: 8,
  },
  filterScroll: {
    flex: 1,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#fff',
  },
  filterButtonText: {
    color: '#999',
    fontSize: 12,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#000',
  },
  listContainer: {
    padding: 16,
  },
  scrollView: {
    flex: 1,
  },
  videoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'flex-start',
  },
  videoGridItem: {
    width: Platform.OS === 'web' ? '23%' : '48%',
    aspectRatio: 1,
  },
  videoCard: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0a0a0a',
    position: 'relative',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 12,
  },
  videosSection: {
    marginTop: 16,
  },
  videoTypeContainer: {
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  videoTypeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  videoTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  videoTypeCard: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  videoTypeCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#001AFF20',
  },
  videoTypeImage: {
    width: 40,
    height: 40,
    marginBottom: 8,
  },
  videoTypeName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  videoTypeNameSelected: {
    color: '#007AFF',
  },
  videoTypeCount: {
    fontSize: 10,
    color: '#999',
  },
  sideSelectionContainer: {
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    marginBottom: 12,
  },
  sideButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  sideSelectionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#333',
    gap: 12,
  },
  sideSelectionButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#001AFF20',
  },
  sideSelectionIcon: {
    width: 32,
    height: 32,
  },
  sideSelectionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  sideSelectionTextActive: {
    color: '#007AFF',
  },
  videoTypeTreeContainer: {
    paddingHorizontal: 12,
  },
  videoTypeTreeItem: {
    marginBottom: 12,
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  videoTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#0a0a0a',
  },
  videoTypeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  videoTypeTreeIcon: {
    width: 32,
    height: 32,
  },
  videoTypeTreeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  videoTypeTreeCount: {
    fontSize: 14,
    color: '#999',
    marginLeft: 4,
  },
  videoTypeContent: {
    padding: 12,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  videoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  difficultyText: {
    color: '#000',
    fontSize: 11,
    fontWeight: 'bold',
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  videoPosition: {
    fontSize: 14,
    color: '#999',
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
  // New hierarchical structure styles
  categoryCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#999',
  },
  categorySection: {
    marginBottom: 16,
  },
  essentialSection: {
    backgroundColor: '#1a1200',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#fbbf24',
  },
  essentialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sideTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sideIcon: {
    width: 24,
    height: 24,
  },
  essentialTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fbbf24',
  },
  infoButton: {
    padding: 4,
  },
  essentialDescription: {
    fontSize: 13,
    color: '#d4a574',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  videoCategorySelectorContainer: {
    marginVertical: 16,
    paddingHorizontal: 4,
  },
  videoCategorySelectorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  categorySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  categorySectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categorySectionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  videoCategoryCard: {
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    marginBottom: 12,
    padding: 12,
  },
  videoCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  videoCategoryThumbnail: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    overflow: 'hidden',
  },
  videoCategoryThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  videoCategoryThumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoCategoryThumbnailText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  videoCategoryInfo: {
    flex: 1,
  },
  videoCategoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  videoCategoryCount: {
    fontSize: 12,
    color: '#999',
  },
  videosList: {
    paddingLeft: 0,
  },
});
