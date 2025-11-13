import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Edit, Trash2, X, ArrowLeft, Users, Shield } from 'lucide-react-native';
import { router } from 'expo-router';

type Map = Database['public']['Tables']['maps']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];
type CategorySection = Database['public']['Tables']['category_sections']['Row'];
type VideoCategory = Database['public']['Tables']['video_categories']['Row'];

interface VideoCategoryWithDetails extends VideoCategory {
  map_name?: string;
  category_name?: string;
  section_name?: string;
}

export default function AdminVideoCategoriesScreen() {
  const { user, isAdmin } = useAuth();
  const [videoCategories, setVideoCategories] = useState<VideoCategoryWithDetails[]>([]);
  const [maps, setMaps] = useState<Map[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sections, setSections] = useState<CategorySection[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVideoCategory, setEditingVideoCategory] = useState<VideoCategory | null>(null);
  const [formData, setFormData] = useState({
    category_section_id: '',
    name: '',
    thumbnail_url: '',
  });
  const [submitting, setSubmitting] = useState(false);

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

      // Fetch video categories with details
      const { data: videoCategoriesData, error: videoCategoriesError } = await supabase
        .from('video_categories')
        .select(`
          *,
          category_sections!inner (
            name,
            categories!inner (
              name,
              maps!inner (
                name
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (videoCategoriesError) throw videoCategoriesError;

      // Fetch maps for the form
      const { data: mapsData, error: mapsError } = await supabase
        .from('maps')
        .select('*')
        .order('name');

      if (mapsError) throw mapsError;

      setVideoCategories(
        (videoCategoriesData || []).map((vc: any) => ({
          ...vc,
          map_name: vc.category_sections?.categories?.maps?.name,
          category_name: vc.category_sections?.categories?.name,
          section_name: vc.category_sections?.name,
        }))
      );
      setMaps(mapsData || []);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load video categories');
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategoriesForMap(mapId: string) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('map_id', mapId)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }

  async function fetchSectionsForCategory(categoryId: string) {
    try {
      const { data, error } = await supabase
        .from('category_sections')
        .select('*')
        .eq('category_id', categoryId)
        .order('name');

      if (error) throw error;
      setSections(data || []);
    } catch (err) {
      console.error('Error fetching sections:', err);
    }
  }

  async function handleSubmit() {
    if (!formData.category_section_id || !formData.name.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);

      if (editingVideoCategory) {
        // Update existing video category
        const { error } = await (supabase as any)
          .from('video_categories')
          .update({
            category_section_id: formData.category_section_id,
            name: formData.name.trim(),
            thumbnail_url: formData.thumbnail_url.trim() || null,
          })
          .eq('id', editingVideoCategory.id);

        if (error) throw error;
      } else {
        // Create new video category
        const { error } = await (supabase as any)
          .from('video_categories')
          .insert({
            category_section_id: formData.category_section_id,
            name: formData.name.trim(),
            thumbnail_url: formData.thumbnail_url.trim() || null,
          });

        if (error) throw error;
      }

      await fetchData();
      closeModal();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save video category');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this video category? This will also delete all associated videos.')) {
      return;
    }

    try {
      const { error } = await supabase.from('video_categories').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete video category');
    }
  }

  function openModal(videoCategory?: VideoCategory) {
    if (videoCategory) {
      setEditingVideoCategory(videoCategory);
      setFormData({
        category_section_id: videoCategory.category_section_id,
        name: videoCategory.name,
        thumbnail_url: videoCategory.thumbnail_url || '',
      });
    } else {
      setEditingVideoCategory(null);
      setFormData({
        category_section_id: '',
        name: '',
        thumbnail_url: '',
      });
    }
    setModalVisible(true);
  }

  function closeModal() {
    setModalVisible(false);
    setEditingVideoCategory(null);
    setFormData({
      category_section_id: '',
      name: '',
      thumbnail_url: '',
    });
    setCategories([]);
    setSections([]);
  }

  function renderVideoCategoryItem({ item }: { item: VideoCategoryWithDetails }) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardThumbnail}>
            {item.thumbnail_url ? (
              <Image
                source={{ uri: item.thumbnail_url }}
                style={styles.thumbnailImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.thumbnailPlaceholder}>
                <Text style={styles.thumbnailText}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSubtitle}>
              {item.map_name} • {item.category_name} • {item.section_name} Side
            </Text>
          </View>
        </View>
        <View style={styles.cardActions}>
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
        <Text style={styles.title}>Manage Video Categories</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
          <Plus size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={videoCategories}
        renderItem={renderVideoCategoryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No video categories yet. Add your first one!</Text>
          </View>
        }
      />

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingVideoCategory ? 'Edit Video Category' : 'Add Video Category'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Text style={styles.label}>Map *</Text>
              <View style={styles.selector}>
                <Text style={styles.selectorText}>
                  {maps.find((m) => m.id === formData.category_section_id)?.name || 'Select a map'}
                </Text>
              </View>
              <FlatList
                data={maps}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.option}
                    onPress={() => {
                      fetchCategoriesForMap(item.id);
                      setFormData({ ...formData, category_section_id: '' });
                    }}>
                    <Text style={styles.optionText}>{item.name}</Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id}
                style={styles.optionList}
              />

              {categories.length > 0 && (
                <>
                  <Text style={styles.label}>Category *</Text>
                  <View style={styles.selector}>
                    <Text style={styles.selectorText}>
                      {categories.find((c) => c.id === formData.category_section_id)?.name || 'Select a category'}
                    </Text>
                  </View>
                  <FlatList
                    data={categories}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.option}
                        onPress={() => {
                          fetchSectionsForCategory(item.id);
                          setFormData({ ...formData, category_section_id: '' });
                        }}>
                        <Text style={styles.optionText}>{item.name}</Text>
                      </TouchableOpacity>
                    )}
                    keyExtractor={(item) => item.id}
                    style={styles.optionList}
                  />
                </>
              )}

              {sections.length > 0 && (
                <>
                  <Text style={styles.label}>Section *</Text>
                  <View style={styles.selector}>
                    <Text style={styles.selectorText}>
                      {sections.find((s) => s.id === formData.category_section_id)?.name || 'Select a section'}
                    </Text>
                  </View>
                  <FlatList
                    data={sections}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.option}
                        onPress={() => setFormData({ ...formData, category_section_id: item.id })}>
                        <View style={styles.sectionOption}>
                          {item.name === 'T' ? (
                            <Users size={16} color="#ff6b6b" />
                          ) : (
                            <Shield size={16} color="#4ecdc4" />
                          )}
                          <Text style={styles.optionText}>{item.name} Side</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                    keyExtractor={(item) => item.id}
                    style={styles.optionList}
                  />
                </>
              )}

              <Text style={styles.label}>Video Category Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Long A Smokes, CT Spawn Smokes"
                placeholderTextColor="#666"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />

              <Text style={styles.label}>Thumbnail URL</Text>
              <TextInput
                style={styles.input}
                placeholder="https://..."
                placeholderTextColor="#666"
                value={formData.thumbnail_url}
                onChangeText={(text) => setFormData({ ...formData, thumbnail_url: text })}
                autoCapitalize="none"
              />

              {formData.thumbnail_url && (
                <Image
                  source={{ uri: formData.thumbnail_url }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
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
                disabled={submitting || !formData.category_section_id}>
                {submitting ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {editingVideoCategory ? 'Update' : 'Create'}
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
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#fff',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#1a1a20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardContent: {
    flex: 1,
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
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#1a1a20',
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
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    marginTop: 16,
  },
  selector: {
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  selectorText: {
    color: '#fff',
    fontSize: 16,
  },
  optionList: {
    maxHeight: 120,
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    marginBottom: 16,
  },
  option: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
  },
  sectionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
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
});
