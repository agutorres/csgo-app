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
import { Plus, Edit, Trash2, X, ArrowLeft, Map } from 'lucide-react-native';
import { router } from 'expo-router';

type Map = Database['public']['Tables']['maps']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

interface CategoryWithMap extends Category {
  map_name?: string;
}

export default function AdminCategoriesScreen() {
  const { user, isAdmin } = useAuth();
  const [categories, setCategories] = useState<CategoryWithMap[]>([]);
  const [maps, setMaps] = useState<Map[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    map_id: '',
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

      // Fetch categories with map names
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select(`
          *,
          maps!inner (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (categoriesError) throw categoriesError;

      // Fetch maps for the form
      const { data: mapsData, error: mapsError } = await supabase
        .from('maps')
        .select('*')
        .order('name');

      if (mapsError) throw mapsError;

      setCategories(
        (categoriesData || []).map((cat: any) => ({
          ...cat,
          map_name: cat.maps?.name,
        }))
      );
      setMaps(mapsData || []);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!formData.map_id || !formData.name.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);

      if (editingCategory) {
        // Update existing category
        const { error } = await (supabase as any)
          .from('categories')
          .update({
            map_id: formData.map_id,
            name: formData.name.trim(),
            thumbnail_url: formData.thumbnail_url.trim() || null,
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
      } else {
        // Create new category
        const { data: categoryData, error: categoryError } = await (supabase as any)
          .from('categories')
          .insert({
            map_id: formData.map_id,
            name: formData.name.trim(),
            thumbnail_url: formData.thumbnail_url.trim() || null,
          })
          .select()
          .single();

        if (categoryError) throw categoryError;

        // Automatically create T and CT sections for the new category
        const { error: sectionsError } = await (supabase as any)
          .from('category_sections')
          .insert([
            {
              category_id: categoryData.id,
              name: 'T',
            },
            {
              category_id: categoryData.id,
              name: 'CT',
            },
          ]);

        if (sectionsError) throw sectionsError;
      }

      await fetchData();
      closeModal();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save category');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this category? This will also delete all associated sections and video categories.')) {
      return;
    }

    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete category');
    }
  }

  function openModal(category?: Category) {
    if (category) {
      setEditingCategory(category);
      setFormData({
        map_id: category.map_id,
        name: category.name,
        thumbnail_url: category.thumbnail_url || '',
      });
    } else {
      setEditingCategory(null);
      setFormData({
        map_id: maps[0]?.id || '',
        name: '',
        thumbnail_url: '',
      });
    }
    setModalVisible(true);
  }

  function closeModal() {
    setModalVisible(false);
    setEditingCategory(null);
    setFormData({
      map_id: '',
      name: '',
      thumbnail_url: '',
    });
  }

  function renderCategoryItem({ item }: { item: CategoryWithMap }) {
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
            <Text style={styles.cardSubtitle}>{item.map_name}</Text>
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
        <Text style={styles.title}>Manage Categories</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
          <Plus size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No categories yet. Add your first category!</Text>
          </View>
        }
      />

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Text style={styles.label}>Map *</Text>
              <View style={styles.mapSelector}>
                <Map size={20} color="#666" />
                <Text style={styles.mapText}>
                  {maps.find((m) => m.id === formData.map_id)?.name || 'Select a map'}
                </Text>
              </View>
              <FlatList
                data={maps}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.mapOption}
                    onPress={() => setFormData({ ...formData, map_id: item.id })}>
                    <Text style={styles.mapOptionText}>{item.name}</Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id}
                style={styles.mapList}
              />

              <Text style={styles.label}>Category Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Smoke, Flash, Molotov"
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

              {!editingCategory && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    T and CT sections will be automatically created for this category.
                  </Text>
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
                    {editingCategory ? 'Update' : 'Create'}
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
    backgroundColor: '#1a1a1a',
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
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    marginTop: 16,
  },
  mapSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    gap: 8,
  },
  mapText: {
    color: '#fff',
    fontSize: 16,
  },
  mapList: {
    maxHeight: 120,
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    marginBottom: 16,
  },
  mapOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  mapOptionText: {
    color: '#fff',
    fontSize: 16,
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
  infoBox: {
    backgroundColor: '#1a3a1a',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  infoText: {
    color: '#4ade80',
    fontSize: 14,
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
