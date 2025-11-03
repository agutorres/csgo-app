import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  Alert,
} from 'react-native';
import { X, Play, ChevronDown, ChevronUp } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import ImageViewerModal from './ImageViewerModal';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface VideoDetail {
  id: string;
  name: string;
  image_url: string;
}

interface Video {
  id: string;
  title: string;
  position_name: string;
  difficulty: 'easy' | 'mid' | 'hard';
  map_image?: string;
  video_category_name?: string;
  video_category_thumbnail?: string;
  tags?: string[];
}

interface VideoExpandModalProps {
  visible: boolean;
  onClose: () => void;
  video: Video | null;
  onWatchVideo: (videoId: string) => void;
  onImagePress?: (imageUrl: string) => void;
}

export default function VideoExpandModal({
  visible,
  onClose,
  video,
  onWatchVideo,
  onImagePress,
}: VideoExpandModalProps) {
  const [videoDetails, setVideoDetails] = useState<VideoDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [expandedDetails, setExpandedDetails] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  React.useEffect(() => {
    if (visible && video) {
      loadVideoDetails();
    }
  }, [visible, video]);

  const loadVideoDetails = async () => {
    if (!video) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('video_details')
        .select('*')
        .eq('video_id', video.id)
        .order('name');

      if (error) throw error;
      setVideoDetails(data || []);
    } catch (error) {
      console.error('Error loading video details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
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
  };

  const handleWatchVideo = () => {
    if (video) {
      onWatchVideo(video.id);
      onClose();
    }
  };

  const closeImageModal = () => {
    setImageModalVisible(false);
    setSelectedImage(null);
  };

  const handleImagePress = (imageUrl: string) => {
    if (imageUrl && imageUrl.trim()) {
      // If onImagePress prop is provided, use it (for root-level modal)
      if (onImagePress) {
        onImagePress(imageUrl);
      } else {
        // Otherwise, use internal modal (fallback for web)
        setSelectedImage(imageUrl);
        setImageModalVisible(true);
      }
    } else {
      Alert.alert('No Image', 'This detail has no image to display');
    }
  };

  const renderDetailItem = (detail: VideoDetail) => (
    <TouchableOpacity
      key={detail.id}
      style={styles.detailItem}
      onPress={() => handleImagePress(detail.image_url)}
      disabled={!detail.image_url}
    >
      <View style={styles.detailContent}>
        <Text style={styles.detailName}>{detail.name}</Text>
        {detail.image_url ? (
          <Image source={{ uri: detail.image_url }} style={styles.detailThumbnail} />
        ) : (
          <View style={styles.noImagePlaceholder}>
            <Text style={styles.noImageText}>No image</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (!video) return null;

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.header}>
              <View style={styles.videoInfo}>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>{video.title}</Text>
                  {video.video_category_thumbnail && (
                    <Image 
                      source={{ uri: video.video_category_thumbnail }} 
                      style={styles.categoryThumbnail} 
                    />
                  )}
                </View>
                <Text style={styles.position}>{video.position_name}</Text>
                <View style={styles.badges}>
                  <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(video.difficulty) }]}>
                    <Text style={styles.difficultyText}>{video.difficulty.toUpperCase()}</Text>
                  </View>
                  {video.map_image && (
                    <Image source={{ uri: video.map_image }} style={styles.mapThumbnail} />
                  )}
                </View>
                {video.tags && video.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {video.tags.map((tag, index) => (
                      <View key={index} style={styles.tagBadge}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
              <TouchableOpacity style={styles.watchButton} onPress={handleWatchVideo}>
                <Play size={20} color="#000" />
                <Text style={styles.watchButtonText}>Watch Video</Text>
              </TouchableOpacity>

              <View style={styles.detailsSection}>
                <TouchableOpacity
                  style={styles.detailsHeader}
                  onPress={() => setExpandedDetails(!expandedDetails)}
                >
                  <Text style={styles.detailsTitle}>Video Details ({videoDetails.length})</Text>
                  {expandedDetails ? <ChevronUp size={20} color="#fff" /> : <ChevronDown size={20} color="#fff" />}
                </TouchableOpacity>

                {expandedDetails && (
                  <View style={styles.detailsList}>
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" style={styles.loading} />
                    ) : videoDetails.length > 0 ? (
                      videoDetails.map(renderDetailItem)
                    ) : (
                      <Text style={styles.noDetailsText}>No details available</Text>
                    )}
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Image Viewer Modal - Separate component for better iOS compatibility */}
      <ImageViewerModal
        visible={imageModalVisible}
        imageUrl={selectedImage}
        onClose={closeImageModal}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  videoInfo: {
    flex: 1,
    marginRight: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  categoryThumbnail: {
    width: 24,
    height: 24,
    borderRadius: 4,
    marginLeft: 8,
  },
  position: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  difficultyText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  mapThumbnail: {
    width: 32,
    height: 20,
    borderRadius: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tagBadge: {
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  watchButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  watchButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailsSection: {
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    overflow: 'hidden',
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  detailsList: {
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  detailItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  detailContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailName: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
  },
  detailThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 4,
  },
  noImagePlaceholder: {
    width: 40,
    height: 40,
    backgroundColor: '#333',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#666',
    fontSize: 10,
  },
  loading: {
    padding: 20,
  },
  noDetailsText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
  imageOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullImage: {
    width: screenWidth - 40,
    height: screenHeight - 40,
  },
  closeImageButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Image Modal styles - Using React Native Modal component
  imageModalFullScreen: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalSafeArea: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalBackground: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imageModalContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  imageModalImage: {
    width: screenWidth - 40,
    height: screenHeight - 200,
  },
  zoomHint: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    textAlign: 'center',
    color: '#fff',
    fontSize: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
});
