import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Plus, X, Image as ImageIcon } from 'lucide-react-native';

interface VideoDetail {
  id?: string;
  name: string;
  image_url: string;
}

interface VideoDetailsFormProps {
  initialDetails?: VideoDetail[];
  onDetailsChange: (details: VideoDetail[]) => void;
}

export default function VideoDetailsForm({
  initialDetails = [],
  onDetailsChange,
}: VideoDetailsFormProps) {
  const [details, setDetails] = useState<VideoDetail[]>(
    initialDetails.length > 0 
      ? initialDetails 
      : [
          { name: 'Position', image_url: '' },
          { name: 'Aiming', image_url: '' },
          { name: 'End point', image_url: '' }
        ]
  );

  const handleDetailChange = (index: number, field: 'name' | 'image_url', value: string) => {
    const newDetails = [...details];
    newDetails[index] = { ...newDetails[index], [field]: value };
    setDetails(newDetails);
    // Don't call onDetailsChange here - let useEffect handle it
  };

  const addDetail = () => {
    const newDetails = [...details, { name: '', image_url: '' }];
    setDetails(newDetails);
    // Don't call onDetailsChange here - let useEffect handle it
  };

  const removeDetail = (index: number) => {
    if (details.length <= 1) {
      Alert.alert('Cannot Remove', 'At least one detail is required');
      return;
    }
    
    const newDetails = details.filter((_, i) => i !== index);
    setDetails(newDetails);
    // Don't call onDetailsChange here - let useEffect handle it
  };

  React.useEffect(() => {
    // Call onDetailsChange with current details
    onDetailsChange(details);
  }, [details]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Video Details</Text>
        <Text style={styles.subtitle}>Add images and details for this video</Text>
      </View>

      <ScrollView style={styles.detailsList}>
        {details.map((detail, index) => (
          <View key={index} style={styles.detailItem}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailNumber}>Detail {index + 1}</Text>
              {details.length > 1 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeDetail(index)}
                >
                  <X size={16} color="#ff4444" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.detailForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Detail Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Position, Aiming, End point"
                  placeholderTextColor="#666"
                  value={detail.name}
                  onChangeText={(text) => handleDetailChange(index, 'name', text)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Image URL</Text>
                <View style={styles.urlInputContainer}>
                  <ImageIcon size={16} color="#666" style={styles.urlIcon} />
                  <TextInput
                    style={styles.urlInput}
                    placeholder="https://example.com/image.jpg"
                    placeholderTextColor="#666"
                    value={detail.image_url}
                    onChangeText={(text) => handleDetailChange(index, 'image_url', text)}
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                </View>
                {detail.image_url && (
                  <View style={styles.imagePreview}>
                    <Text style={styles.imagePreviewText}>Image Preview:</Text>
                    <Text style={styles.imageUrl} numberOfLines={1}>
                      {detail.image_url}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.addButton} onPress={addDetail}>
        <Plus size={16} color="#fff" />
        <Text style={styles.addButtonText}>Add Detail</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    marginTop: 20,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#999',
  },
  detailsList: {
    maxHeight: 300,
  },
  detailItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  removeButton: {
    padding: 4,
  },
  detailForm: {
    gap: 12,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
  },
  urlInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  urlIcon: {
    marginRight: 8,
  },
  urlInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },
  imagePreview: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
  },
  imagePreviewText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  imageUrl: {
    fontSize: 12,
    color: '#666',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
    paddingVertical: 12,
    margin: 16,
    borderRadius: 6,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
