import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { ChevronDown, ChevronUp, Play } from 'lucide-react-native';

interface Video {
  id: string;
  title: string;
  position_name: string;
  difficulty: 'easy' | 'mid' | 'hard';
  map_image?: string;
  video_category_name?: string;
  video_category_thumbnail?: string;
}

interface CollapsibleVideoListProps {
  title: string;
  videos: Video[];
  onVideoPress: (video: Video) => void;
  onWatchVideo: (videoId: string) => void;
  loading?: boolean;
  defaultExpanded?: boolean;
  sideIcon?: any; // For T/CT side icons
}

const VIDEOS_PER_PAGE = 8;

export default function CollapsibleVideoList({
  title,
  videos,
  onVideoPress,
  onWatchVideo,
  loading = false,
  defaultExpanded = false,
  sideIcon,
}: CollapsibleVideoListProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = Math.ceil(videos.length / VIDEOS_PER_PAGE);
  const startIndex = currentPage * VIDEOS_PER_PAGE;
  const endIndex = startIndex + VIDEOS_PER_PAGE;
  const currentVideos = videos.slice(startIndex, endIndex);

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

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const renderVideoItem = ({ item }: { item: Video }) => (
    <TouchableOpacity
      style={styles.videoItem}
      onPress={() => onVideoPress(item)}
    >
      <View style={styles.videoContent}>
        <View style={styles.videoInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.videoTitle} numberOfLines={1}>{item.title}</Text>
            {item.video_category_thumbnail && (
              <Image 
                source={{ uri: item.video_category_thumbnail }} 
                style={styles.categoryThumbnail} 
              />
            )}
          </View>
          <Text style={styles.positionName} numberOfLines={1}>{item.position_name}</Text>
          <View style={styles.badges}>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) }]}>
              <Text style={styles.difficultyText}>{item.difficulty.toUpperCase()}</Text>
            </View>
            {item.map_image && (
              <Image source={{ uri: item.map_image }} style={styles.mapThumbnail} />
            )}
          </View>
        </View>
        <TouchableOpacity
          style={styles.watchButton}
          onPress={(e) => {
            e.stopPropagation();
            onWatchVideo(item.id);
          }}
        >
          <Play size={16} color="#000" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <View style={styles.pagination}>
        <TouchableOpacity
          style={[styles.paginationButton, currentPage === 0 && styles.paginationButtonDisabled]}
          onPress={handlePrevPage}
          disabled={currentPage === 0}
        >
          <Text style={[styles.paginationButtonText, currentPage === 0 && styles.paginationButtonTextDisabled]}>
            Previous
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.paginationInfo}>
          {currentPage + 1} of {totalPages}
        </Text>
        
        <TouchableOpacity
          style={[styles.paginationButton, currentPage === totalPages - 1 && styles.paginationButtonDisabled]}
          onPress={handleNextPage}
          disabled={currentPage === totalPages - 1}
        >
          <Text style={[styles.paginationButtonText, currentPage === totalPages - 1 && styles.paginationButtonTextDisabled]}>
            Next
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {title && (
        <TouchableOpacity
          style={styles.header}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <View style={styles.headerLeft}>
            {sideIcon && (
              <Image 
                source={sideIcon}
                style={styles.sideIcon}
                resizeMode="contain"
              />
            )}
            <Text style={styles.title}>{title} ({videos.length})</Text>
          </View>
          {isExpanded ? <ChevronUp size={20} color="#fff" /> : <ChevronDown size={20} color="#fff" />}
        </TouchableOpacity>
      )}

      {isExpanded && (
        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.loadingText}>Loading videos...</Text>
            </View>
          ) : currentVideos.length > 0 ? (
            <>
              <FlatList
                data={currentVideos}
                renderItem={renderVideoItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
              {renderPagination()}
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No videos available</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#0a0a0a',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sideIcon: {
    width: 24,
    height: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: 16,
  },
  videoItem: {
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    marginBottom: 12,
    padding: 12,
  },
  videoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  videoInfo: {
    flex: 1,
    marginRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  categoryThumbnail: {
    width: 20,
    height: 20,
    borderRadius: 3,
    marginLeft: 8,
  },
  positionName: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  difficultyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  difficultyText: {
    color: '#000',
    fontSize: 9,
    fontWeight: 'bold',
  },
  mapThumbnail: {
    width: 24,
    height: 15,
    borderRadius: 3,
  },
  watchButton: {
    backgroundColor: '#fff',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  paginationButton: {
    backgroundColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  paginationButtonDisabled: {
    backgroundColor: '#1a1a1a',
  },
  paginationButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  paginationButtonTextDisabled: {
    color: '#666',
  },
  paginationInfo: {
    color: '#999',
    fontSize: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  loadingText: {
    color: '#999',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
  },
});
