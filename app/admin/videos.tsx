import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database, Difficulty } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Edit, Trash2, X, ArrowLeft, Star } from 'lucide-react-native';
import { router } from 'expo-router';
import HierarchicalVideoUpload from '@/components/HierarchicalVideoUpload';

type Video = Database['public']['Tables']['videos']['Row'];
type Map = Database['public']['Tables']['maps']['Row'];
type CategorySection = Database['public']['Tables']['category_sections']['Row'];

interface VideoWithMap extends Video {
  map_name?: string;
  category_section_name?: string;
}

export default function AdminVideosScreen() {
  const [videos, setVideos] = useState<VideoWithMap[]>([]);
  const [maps, setMaps] = useState<Map[]>([]);
  const [categorySections, setCategorySections] = useState<CategorySection[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [formData, setFormData] = useState({
    map_id: '',
    category_section_id: '',
    side: 'T' as 'T' | 'CT',
    video_type: 'nade' as 'nade' | 'smoke' | 'fire' | 'flash',
    title: '',
    video_url: '',
    difficulty: 'easy' as Difficulty,
    position_name: '',
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user, isAdmin } = useAuth();
  const [uploadModalVisible, setUploadModalVisible] = useState(false);

  useEffect(() => {
    if (user && isAdmin) {
      fetchData();
    } else if (user && !isAdmin) {
      alert('Access denied. Admin privileges required.');
      router.replace('/(tabs)');
    } else {
      router.replace('/(tabs)');
    }
  }, [user, isAdmin]);

  async function fetchData() {
    try {
      setLoading(true);

      const [videosResult, mapsResult, categorySectionsResult] = await Promise.all([
        supabase.from('videos').select(`
          *,
          maps!inner (
            name
          ),
          category_sections (
            name
          )
        `).order('created_at', { ascending: false }),
        supabase.from('maps').select('*').order('name'),
        supabase.from('category_sections').select('*').order('name'),
      ]);

      if (videosResult.error) throw videosResult.error;
      if (mapsResult.error) throw mapsResult.error;
      if (categorySectionsResult.error) throw categorySectionsResult.error;

      setMaps(mapsResult.data || []);
      setCategorySections(categorySectionsResult.data || []);

      const videosWithMaps = (videosResult.data || []).map((video: any) => ({
        ...video,
        map_name: video.maps?.name,
        category_section_name: video.category_sections?.name,
      }));

      setVideos(videosWithMaps);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (
      !formData.map_id ||
      !formData.category_section_id ||
      !formData.side ||
      !formData.video_type ||
      !formData.title.trim() ||
      !formData.video_url.trim() ||
      !formData.position_name.trim()
    ) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);

      if (editingVideo) {
        const { error } = await (supabase as any)
          .from('videos')
          .update({
            map_id: formData.map_id,
            category_section_id: formData.category_section_id,
            side: formData.side,
            video_type: formData.video_type,
            title: formData.title.trim(),
            video_url: formData.video_url.trim(),
            difficulty: formData.difficulty,
            position_name: formData.position_name.trim(),
            tags: formData.tags.length > 0 ? formData.tags : null,
          })
          .eq('id', editingVideo.id);

          if (error) throw error;
      } else {
        const { error } = await (supabase as any).from('videos').insert({
          map_id: formData.map_id,
          category_section_id: formData.category_section_id,
          side: formData.side,
          video_type: formData.video_type,
          title: formData.title.trim(),
          video_url: formData.video_url.trim(),
          difficulty: formData.difficulty,
          position_name: formData.position_name.trim(),
          tags: formData.tags.length > 0 ? formData.tags : null,
        });

        if (error) throw error;
      }

      await fetchData();
      closeModal();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save video');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleEssential(id: string, currentEssential: boolean) {
    try {
      const { error } = await supabase
        .from('videos')
        .update({ essential: !currentEssential })
        .eq('id', id);

      if (error) throw error;
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update essential status');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this video?')) {
      return;
    }

    try {
      const { error } = await supabase.from('videos').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete video');
    }
  }

  function openModal(video?: Video) {
    if (video) {
      setEditingVideo(video);
      setFormData({
        map_id: video.map_id,
        category_section_id: video.category_section_id || '',
        side: (video.side as 'T' | 'CT') || 'T',
        video_type: ((video as any).video_type as 'nade' | 'smoke' | 'fire' | 'flash') || 'nade',
        title: video.title,
        video_url: video.video_url || '',
        difficulty: video.difficulty,
        position_name: video.position_name,
        tags: (video as any).tags || [],
      });
      setTagInput('');
    } else {
      setEditingVideo(null);
      setFormData({
        map_id: maps[0]?.id || '',
        category_section_id: '',
        side: 'T',
        video_type: 'nade',
        title: '',
        video_url: '',
        difficulty: 'easy',
        position_name: '',
        tags: [],
      });
      setTagInput('');
    }
    setModalVisible(true);
  }

  function closeModal() {
    setModalVisible(false);
    setEditingVideo(null);
    setFormData({
      map_id: '',
      category_section_id: '',
      side: 'T',
      video_type: 'nade',
      title: '',
      video_url: '',
      difficulty: 'easy',
      position_name: '',
      tags: [],
    });
    setTagInput('');
  }

  function handleAddTag() {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData({ ...formData, tags: [...formData.tags, trimmedTag] });
      setTagInput('');
    }
  }

  function handleRemoveTag(tagToRemove: string) {
    setFormData({ ...formData, tags: formData.tags.filter(tag => tag !== tagToRemove) });
  }

  function getDifficultyColor(difficulty: Difficulty) {
    switch (difficulty) {
      case 'easy':
        return '#4ade80';
      case 'mid':
        return '#fbbf24';
      case 'hard':
        return '#f87171';
    }
  }

  function renderVideoItem({ item }: { item: VideoWithMap }) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.difficultyBadge,
              { backgroundColor: getDifficultyColor(item.difficulty) },
            ]}>
            <Text style={styles.difficultyText}>{item.difficulty.toUpperCase()}</Text>
          </View>
          <Text style={styles.mapBadge}>{item.map_name}</Text>
        </View>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardSubtitle}>{item.position_name}</Text>
        {item.category_section_name && (
          <Text style={styles.cardCategory}>{item.category_section_name} - {item.side} Side</Text>
        )}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.essentialButton, (item as any).essential && styles.essentialButtonActive]}
            onPress={() => toggleEssential(item.id, (item as any).essential || false)}>
            <Star size={16} color={(item as any).essential ? "#fbbf24" : "#666"} fill={(item as any).essential ? "#fbbf24" : "none"} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => openModal(item)}>
            <Edit size={16} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(item.id)}>
            <Trash2 size={16} color="#fff" />
          </TouchableOpacity>
        </View>
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Videos</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setUploadModalVisible(true)}
          disabled={maps.length === 0}>
          <Plus size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {maps.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Please add maps first before adding videos</Text>
        </View>
      ) : (
        <FlatList
          data={videos}
          renderItem={renderVideoItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No videos yet. Upload your first video!</Text>
            </View>
          }
        />
      )}

      <HierarchicalVideoUpload
        visible={uploadModalVisible}
        onClose={() => setUploadModalVisible(false)}
        onUploadComplete={() => {
          fetchData();
          setUploadModalVisible(false);
        }}
      />

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingVideo ? 'Edit Video' : 'Add Video'}</Text>
              <TouchableOpacity onPress={closeModal}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Text style={styles.label}>Map</Text>
              <View style={styles.pickerContainer}>
                {maps.map((map) => (
                  <TouchableOpacity
                    key={map.id}
                    style={[
                      styles.pickerOption,
                      formData.map_id === map.id && styles.pickerOptionActive,
                    ]}
                    onPress={() => setFormData({ ...formData, map_id: map.id, category_section_id: '' })}>
                    <Text
                      style={[
                        styles.pickerOptionText,
                        formData.map_id === map.id && styles.pickerOptionTextActive,
                      ]}>
                      {map.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Category Section</Text>
              <View style={styles.pickerContainer}>
                {categorySections
                  .map((section) => (
                    <TouchableOpacity
                      key={section.id}
                      style={[
                        styles.pickerOption,
                        formData.category_section_id === section.id && styles.pickerOptionActive,
                      ]}
                      onPress={() => setFormData({ ...formData, category_section_id: section.id })}>
                      <Text
                        style={[
                          styles.pickerOptionText,
                          formData.category_section_id === section.id && styles.pickerOptionTextActive,
                        ]}>
                        {section.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>

              <Text style={styles.label}>Side</Text>
              <View style={styles.pickerContainer}>
                <TouchableOpacity
                  style={[
                    styles.pickerOption,
                    formData.side === 'T' && styles.pickerOptionActive,
                  ]}
                  onPress={() => setFormData({ ...formData, side: 'T' })}>
                  <Text
                    style={[
                      styles.pickerOptionText,
                      formData.side === 'T' && styles.pickerOptionTextActive,
                    ]}>
                    T Side
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.pickerOption,
                    formData.side === 'CT' && styles.pickerOptionActive,
                  ]}
                  onPress={() => setFormData({ ...formData, side: 'CT' })}>
                  <Text
                    style={[
                      styles.pickerOptionText,
                      formData.side === 'CT' && styles.pickerOptionTextActive,
                    ]}>
                    CT Side
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Video Type</Text>
              <View style={styles.videoTypePickerContainer}>
                <TouchableOpacity
                  style={[
                    styles.videoTypeOption,
                    formData.video_type === 'nade' && styles.videoTypeOptionActive,
                  ]}
                  onPress={() => setFormData({ ...formData, video_type: 'nade' })}>
                  <Text style={[
                    styles.videoTypeOptionText,
                    formData.video_type === 'nade' && styles.videoTypeOptionTextActive,
                  ]}>
                    Nade
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.videoTypeOption,
                    formData.video_type === 'smoke' && styles.videoTypeOptionActive,
                  ]}
                  onPress={() => setFormData({ ...formData, video_type: 'smoke' })}>
                  <Text style={[
                    styles.videoTypeOptionText,
                    formData.video_type === 'smoke' && styles.videoTypeOptionTextActive,
                  ]}>
                    Smoke
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.videoTypeOption,
                    formData.video_type === 'fire' && styles.videoTypeOptionActive,
                  ]}
                  onPress={() => setFormData({ ...formData, video_type: 'fire' })}>
                  <Text style={[
                    styles.videoTypeOptionText,
                    formData.video_type === 'fire' && styles.videoTypeOptionTextActive,
                  ]}>
                    Fire
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.videoTypeOption,
                    formData.video_type === 'flash' && styles.videoTypeOptionActive,
                  ]}
                  onPress={() => setFormData({ ...formData, video_type: 'flash' })}>
                  <Text style={[
                    styles.videoTypeOptionText,
                    formData.video_type === 'flash' && styles.videoTypeOptionTextActive,
                  ]}>
                    Flash
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., A Site Smoke from T Spawn"
                placeholderTextColor="#666"
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
              />

              <Text style={styles.label}>Position Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., CT Spawn to A Site"
                placeholderTextColor="#666"
                value={formData.position_name}
                onChangeText={(text) => setFormData({ ...formData, position_name: text })}
              />

              <Text style={styles.label}>Video URL</Text>
              <TextInput
                style={styles.input}
                placeholder="https://..."
                placeholderTextColor="#666"
                value={formData.video_url}
                onChangeText={(text) => setFormData({ ...formData, video_url: text })}
                autoCapitalize="none"
              />

              <Text style={styles.label}>Difficulty</Text>
              <View style={styles.difficultyContainer}>
                {(['easy', 'mid', 'hard'] as Difficulty[]).map((diff) => (
                  <TouchableOpacity
                    key={diff}
                    style={[
                      styles.difficultyOption,
                      formData.difficulty === diff && {
                        backgroundColor: getDifficultyColor(diff),
                      },
                    ]}
                    onPress={() => setFormData({ ...formData, difficulty: diff })}>
                    <Text
                      style={[
                        styles.difficultyOptionText,
                        formData.difficulty === diff && styles.difficultyOptionTextActive,
                      ]}>
                      {diff.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Tags</Text>
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={styles.tagInput}
                  placeholder="Enter tag and press Add"
                  placeholderTextColor="#666"
                  value={tagInput}
                  onChangeText={setTagInput}
                  onSubmitEditing={handleAddTag}
                />
                <TouchableOpacity
                  style={styles.addTagButton}
                  onPress={handleAddTag}
                  disabled={!tagInput.trim()}>
                  <Text style={styles.addTagButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
              {formData.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {formData.tags.map((tag, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.tagBadge}
                      onPress={() => handleRemoveTag(tag)}>
                      <Text style={styles.tagText}>{tag}</Text>
                      <Text style={styles.tagRemoveText}> ×</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closeModal}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSubmit}
                disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {editingVideo ? 'Update' : 'Create'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  title: {
    flex: 1,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 12,
  },
  addButton: {
    backgroundColor: '#fff',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadSection: {
    backgroundColor: '#1a1a1a',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
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
  mapBadge: {
    color: '#999',
    fontSize: 12,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  cardCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  essentialButton: {
    backgroundColor: '#333',
  },
  essentialButtonActive: {
    backgroundColor: '#1a1200',
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  editButton: {
    backgroundColor: '#fff',
  },
  deleteButton: {
    backgroundColor: '#ff4444',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  modalOverlay: {
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalContent: {
    padding: 16,
    maxHeight: '65%',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
    marginBottom: 4,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  videoTypePickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  videoTypeOption: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: '#0a0a0a',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  videoTypeOptionActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  videoTypeOptionText: {
    color: '#999',
    fontSize: 12,
    fontWeight: '600',
  },
  videoTypeOptionTextActive: {
    color: '#fff',
  },
  pickerOption: {
    backgroundColor: '#0a0a0a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#0a0a0a',
  },
  pickerOptionActive: {
    borderColor: '#fff',
  },
  pickerOptionText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  pickerOptionTextActive: {
    color: '#fff',
  },
  difficultyContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyOption: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  difficultyOptionText: {
    color: '#666',
    fontSize: 12,
    fontWeight: 'bold',
  },
  difficultyOptionTextActive: {
    color: '#000',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#333',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#fff',
  },
  submitButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tagInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tagInput: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
  },
  addTagButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addTagButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tagBadge: {
    flexDirection: 'row',
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
  },
  tagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  tagRemoveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
