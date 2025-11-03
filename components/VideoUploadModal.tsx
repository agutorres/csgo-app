import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { Database } from '@/types/database';
import VideoUpload from './VideoUpload';

type Difficulty = Database['public']['Tables']['videos']['Row']['difficulty'];

interface VideoUploadModalProps {
  visible: boolean;
  onClose: () => void;
  mapId: string;
  onUploadComplete?: (videoId: string) => void;
}

export default function VideoUploadModal({
  visible,
  onClose,
  mapId,
  onUploadComplete,
}: VideoUploadModalProps) {
  const [title, setTitle] = useState('');
  const [positionName, setPositionName] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadComplete = (videoId: string) => {
    setIsUploading(false);
    onUploadComplete?.(videoId);
    onClose();
    // Reset form
    setTitle('');
    setPositionName('');
    setDifficulty('easy');
  };

  const handleStartUpload = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a video title');
      return;
    }
    if (!positionName.trim()) {
      Alert.alert('Error', 'Please enter a position name');
      return;
    }
    setIsUploading(true);
  };

  const getDifficultyColor = (diff: Difficulty) => {
    switch (diff) {
      case 'easy':
        return '#4ade80';
      case 'mid':
        return '#fbbf24';
      case 'hard':
        return '#f87171';
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Upload New Video</Text>
            <TouchableOpacity onPress={onClose} disabled={isUploading}>
              <X size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Video Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., A Site Smoke from T Spawn"
                placeholderTextColor="#666"
                value={title}
                onChangeText={setTitle}
                editable={!isUploading}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Position Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., CT Spawn to A Site"
                placeholderTextColor="#666"
                value={positionName}
                onChangeText={setPositionName}
                editable={!isUploading}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Difficulty</Text>
              <View style={styles.difficultyContainer}>
                {(['easy', 'mid', 'hard'] as Difficulty[]).map((diff) => (
                  <TouchableOpacity
                    key={diff}
                    style={[
                      styles.difficultyOption,
                      difficulty === diff && {
                        backgroundColor: getDifficultyColor(diff),
                      },
                    ]}
                    onPress={() => setDifficulty(diff)}
                    disabled={isUploading}
                  >
                    <Text
                      style={[
                        styles.difficultyOptionText,
                        difficulty === diff && styles.difficultyOptionTextActive,
                      ]}
                    >
                      {diff.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {isUploading ? (
              <VideoUpload
                mapId={mapId}
                onUploadComplete={handleUploadComplete}
              />
            ) : (
              <TouchableOpacity style={styles.startButton} onPress={handleStartUpload}>
                <Text style={styles.startButtonText}>Start Upload</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
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
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
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
  startButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
