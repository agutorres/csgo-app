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
  Image,
  Alert,
} from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Edit, Trash2, X, ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';

type Callout = Database['public']['Tables']['callouts']['Row'];
type Map = Database['public']['Tables']['maps']['Row'];

interface CalloutWithMap extends Callout {
  map_name?: string;
}

export default function AdminCalloutsScreen() {
  const [callouts, setCallouts] = useState<CalloutWithMap[]>([]);
  const [maps, setMaps] = useState<Map[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCallout, setEditingCallout] = useState<Callout | null>(null);
  const [formData, setFormData] = useState({
    map_id: '',
    name: '',
    image_url: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    if (user && isAdmin) {
      fetchData();
    } else if (user && !isAdmin) {
      Alert.alert('Access denied', 'Admin privileges required.');
      router.replace('/(tabs)');
    } else {
      router.replace('/(tabs)');
    }
  }, [user, isAdmin]);

  async function fetchData() {
    try {
      setLoading(true);

      const [calloutsResult, mapsResult] = await Promise.all([
        supabase.from('callouts').select(`
          *,
          maps!inner (
            name
          )
        `).order('created_at', { ascending: false }),
        supabase.from('maps').select('*').order('name'),
      ]);

      if (calloutsResult.error) throw calloutsResult.error;
      if (mapsResult.error) throw mapsResult.error;

      setMaps(mapsResult.data || []);

      const calloutsWithMaps = (calloutsResult.data || []).map((callout: any) => ({
        ...callout,
        map_name: callout.maps?.name,
      }));

      setCallouts(calloutsWithMaps);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load callouts');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!formData.map_id || !formData.name.trim() || !formData.image_url.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);

      if (editingCallout) {
        const { error } = await supabase
          .from('callouts')
          .update({
            map_id: formData.map_id,
            name: formData.name.trim(),
            image_url: formData.image_url.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingCallout.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('callouts').insert({
          map_id: formData.map_id,
          name: formData.name.trim(),
          image_url: formData.image_url.trim(),
        });

        if (error) throw error;
      }

      await fetchData();
      closeModal();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save callout');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    Alert.alert(
      'Delete Callout',
      'Are you sure you want to delete this callout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('callouts').delete().eq('id', id);
              if (error) throw error;
              await fetchData();
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete callout');
            }
          },
        },
      ]
    );
  }

  function openModal(callout?: Callout) {
    if (callout) {
      setEditingCallout(callout);
      setFormData({
        map_id: callout.map_id,
        name: callout.name,
        image_url: callout.image_url,
      });
    } else {
      setEditingCallout(null);
      setFormData({
        map_id: maps[0]?.id || '',
        name: '',
        image_url: '',
      });
    }
    setModalVisible(true);
  }

  function closeModal() {
    setModalVisible(false);
    setEditingCallout(null);
    setFormData({
      map_id: '',
      name: '',
      image_url: '',
    });
  }

  function renderCalloutItem({ item }: { item: CalloutWithMap }) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.mapBadge}>{item.map_name}</Text>
          <Text style={styles.nameBadge}>{item.name}</Text>
        </View>
        {item.image_url && (
          <Image source={{ uri: item.image_url }} style={styles.thumbnail} resizeMode="cover" />
        )}
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
        <Text style={styles.title}>Manage Callouts</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => openModal()}
          disabled={maps.length === 0}>
          <Plus size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {maps.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Please add maps first before adding callouts</Text>
        </View>
      ) : (
        <FlatList
          data={callouts}
          renderItem={renderCalloutItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No callouts yet. Add your first callout!</Text>
            </View>
          }
        />
      )}

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingCallout ? 'Edit Callout' : 'Add Callout'}</Text>
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
                    onPress={() => setFormData({ ...formData, map_id: map.id })}>
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

              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., T Side Callouts, CT Side Callouts"
                placeholderTextColor="#666"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />

              <Text style={styles.label}>Image URL</Text>
              <TextInput
                style={styles.input}
                placeholder="https://..."
                placeholderTextColor="#666"
                value={formData.image_url}
                onChangeText={(text) => setFormData({ ...formData, image_url: text })}
                autoCapitalize="none"
                multiline
              />
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
                    {editingCallout ? 'Update' : 'Create'}
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
    backgroundColor: '#1a1a1a',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mapBadge: {
    backgroundColor: '#007AFF',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8,
  },
  nameBadge: {
    backgroundColor: '#4ade80',
    color: '#000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 12,
    fontWeight: '600',
  },
  thumbnail: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#0a0a0a',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#fbbf24',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
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
    minHeight: 80,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
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

