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
import { Plus, Edit, Trash2, X, ArrowLeft, ToggleLeft, ToggleRight } from 'lucide-react-native';
import { router } from 'expo-router';

type Map = Database['public']['Tables']['maps']['Row'];

export default function AdminMapsScreen() {
  const [maps, setMaps] = useState<Map[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMap, setEditingMap] = useState<Map | null>(null);
  const [formData, setFormData] = useState({ name: '', thumbnail_url: '' });
  const [submitting, setSubmitting] = useState(false);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    if (user && isAdmin) {
      fetchMaps();
    } else if (user && !isAdmin) {
      alert('Access denied. Admin privileges required.');
      router.replace('/(tabs)');
    } else {
      router.replace('/(tabs)');
    }
  }, [user, isAdmin]);

  async function fetchMaps() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('maps')
        .select('*')
        .order('name');

      if (error) throw error;
      setMaps(data || []);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load maps');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!formData.name.trim() || !formData.thumbnail_url.trim()) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);

      if (editingMap) {
        const { error } = await supabase
          .from('maps')
          .update({
            name: formData.name.trim(),
            thumbnail_url: formData.thumbnail_url.trim(),
          })
          .eq('id', editingMap.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('maps').insert({
          name: formData.name.trim(),
          thumbnail_url: formData.thumbnail_url.trim(),
        });

        if (error) throw error;
      }

      await fetchMaps();
      closeModal();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save map');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this map? All associated videos will also be deleted.')) {
      return;
    }

    try {
      const { error } = await supabase.from('maps').delete().eq('id', id);
      if (error) throw error;
      await fetchMaps();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete map');
    }
  }

  async function toggleMapStatus(id: string, currentStatus: string) {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const { error } = await supabase
        .from('maps')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      await fetchMaps();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update map status');
    }
  }

  function openModal(map?: Map) {
    if (map) {
      setEditingMap(map);
      setFormData({ name: map.name, thumbnail_url: map.thumbnail_url });
    } else {
      setEditingMap(null);
      setFormData({ name: '', thumbnail_url: '' });
    }
    setModalVisible(true);
  }

  function closeModal() {
    setModalVisible(false);
    setEditingMap(null);
    setFormData({ name: '', thumbnail_url: '' });
  }

  function renderMapItem({ item }: { item: Map }) {
    const isActive = (item as any).status === 'active';
    
    return (
      <View style={styles.card}>
        <Image source={{ uri: item.thumbnail_url }} style={styles.thumbnail} resizeMode="cover" />
        <View style={styles.cardContent}>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusBadge, isActive ? styles.activeBadge : styles.inactiveBadge]}>
                <Text style={[styles.statusText, isActive ? styles.activeText : styles.inactiveText]}>
                  {isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.toggleButton]}
              onPress={() => toggleMapStatus(item.id, (item as any).status || 'active')}>
              {isActive ? <ToggleRight size={16} color="#4ade80" /> : <ToggleLeft size={16} color="#666" />}
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
        <Text style={styles.title}>Manage Maps</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
          <Plus size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={maps}
        renderItem={renderMapItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No maps yet. Add your first map!</Text>
          </View>
        }
      />

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingMap ? 'Edit Map' : 'Add Map'}</Text>
              <TouchableOpacity onPress={closeModal}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Text style={styles.label}>Map Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Dust 2, Mirage"
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
                disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {editingMap ? 'Update' : 'Create'}
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
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  thumbnail: {
    width: '100%',
    height: 150,
  },
  cardContent: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#4ade80',
  },
  inactiveBadge: {
    backgroundColor: '#666',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeText: {
    color: '#000',
  },
  inactiveText: {
    color: '#fff',
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
  toggleButton: {
    backgroundColor: '#333',
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
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 16,
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
});
