import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Database } from '@/types/database';

type VideoCategory = Database['public']['Tables']['video_categories']['Row'];
type Video = Database['public']['Tables']['videos']['Row'];

interface VideoCategoryWithCount extends VideoCategory {
  videoCount: number;
}

interface VideoCategorySelectorProps {
  videoCategories: VideoCategoryWithCount[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export default function VideoCategorySelector({
  videoCategories,
  selectedCategoryId,
  onSelectCategory,
}: VideoCategorySelectorProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {videoCategories.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.card,
            selectedCategoryId === category.id && styles.cardSelected,
          ]}
          onPress={() =>
            onSelectCategory(selectedCategoryId === category.id ? null : category.id)
          }
        >
          {category.thumbnail_url ? (
            <Image
              source={{ uri: category.thumbnail_url }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.thumbnailPlaceholder}>
              <Text style={styles.placeholderText}>
                {category.name.substring(0, 2).toUpperCase()}
              </Text>
            </View>
          )}
          
          <View style={styles.cardContent}>
            <Text style={styles.cardName} numberOfLines={1}>
              {category.name}
            </Text>
            <Text style={styles.cardCount}>{category.videoCount} videos</Text>
          </View>
          
          {selectedCategoryId === category.id && (
            <View style={styles.selectedIndicator}>
              <Text style={styles.selectedText}>✓</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  content: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: 120,
    height: 160,
    borderRadius: 12,
    backgroundColor: '#0a0a0a',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: '#fbbf24',
  },
  thumbnail: {
    width: '100%',
    height: 80,
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: 80,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
  },
  cardContent: {
    padding: 12,
    flex: 1,
    justifyContent: 'flex-end',
  },
  cardName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  cardCount: {
    fontSize: 11,
    color: '#999',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fbbf24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

