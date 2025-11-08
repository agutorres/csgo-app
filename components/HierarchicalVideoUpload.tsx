import React, { useState, useEffect } from 'react';
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
import { X, ChevronRight, Check, Plus } from 'lucide-react-native';
import { Image } from 'react-native';
import { supabase } from '@/lib/supabase';
import VideoUpload from './VideoUpload';
import VideoDetailsForm from './VideoDetailsForm';

interface Map {
  id: string;
  name: string;
  thumbnail_url: string;
}

interface Category {
  id: string;
  name: string;
  thumbnail_url?: string;
}

interface CategorySection {
  id: string;
  name: string;
  thumbnail_url?: string;
}

interface VideoDetail {
  id?: string;
  name: string;
  image_url: string;
}

interface HierarchicalVideoUploadProps {
  visible: boolean;
  onClose: () => void;
  onUploadComplete?: (videoId: string) => void;
}

type SelectionStep = 'map' | 'category' | 'section' | 'side' | 'videoType' | 'details' | 'videoDetails';

export default function HierarchicalVideoUpload({
  visible,
  onClose,
  onUploadComplete,
}: HierarchicalVideoUploadProps) {
  const [currentStep, setCurrentStep] = useState<SelectionStep>('map');
  const [selectedMap, setSelectedMap] = useState<Map | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSection, setSelectedSection] = useState<CategorySection | null>(null);
  const [selectedSide, setSelectedSide] = useState<'T' | 'CT' | null>(null);
  const [selectedVideoType, setSelectedVideoType] = useState<'nade' | 'smoke' | 'fire' | 'flash' | null>(null);
  
  // Form data
  const [title, setTitle] = useState('');
  const [positionName, setPositionName] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'mid' | 'hard'>('easy');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [essential, setEssential] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [videoDetails, setVideoDetails] = useState<VideoDetail[]>([]);

  // Data states
  const [maps, setMaps] = useState<Map[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sections, setSections] = useState<CategorySection[]>([]);
  const [loading, setLoading] = useState(false);

  // Load maps on mount
  useEffect(() => {
    if (visible) {
      loadMaps();
    }
  }, [visible]);

  // Load categories when map is selected
  useEffect(() => {
    if (selectedMap) {
      loadCategories(selectedMap.id);
    }
  }, [selectedMap]);

  // Load sections when category is selected
  useEffect(() => {
    if (selectedCategory) {
      loadSections(selectedCategory.id);
    }
  }, [selectedCategory]);

  const loadMaps = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('maps')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setMaps(data || []);
    } catch (error) {
      console.error('Error loading maps:', error);
      Alert.alert('Error', 'Failed to load maps');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async (mapId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('map_id', mapId)
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Error', 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const loadSections = async (categoryId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('category_sections')
        .select('*')
        .eq('category_id', categoryId)
        .order('name');
      
      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      console.error('Error loading sections:', error);
      Alert.alert('Error', 'Failed to load sections');
    } finally {
      setLoading(false);
    }
  };


  const handleSelection = (item: any, type: string) => {
    switch (type) {
      case 'map':
        setSelectedMap(item);
        setCurrentStep('category');
        break;
      case 'category':
        setSelectedCategory(item);
        setCurrentStep('section');
        break;
      case 'section':
        setSelectedSection(item);
        setCurrentStep('side');
        break;
      case 'side':
        setSelectedSide(item);
        setCurrentStep('videoType');
        break;
      case 'videoType':
        setSelectedVideoType(item);
        setCurrentStep('details');
        break;
      case 'details':
        setCurrentStep('videoDetails');
        break;
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'category':
        setCurrentStep('map');
        setSelectedMap(null);
        setSelectedCategory(null);
        setSelectedSection(null);
        setSelectedSide(null);
        break;
      case 'section':
        setCurrentStep('category');
        setSelectedCategory(null);
        setSelectedSection(null);
        setSelectedSide(null);
        break;
      case 'side':
        setCurrentStep('section');
        setSelectedSection(null);
        setSelectedSide(null);
        break;
      case 'videoType':
        setCurrentStep('side');
        setSelectedSide(null);
        setSelectedVideoType(null);
        break;
      case 'details':
        setCurrentStep('videoType');
        setSelectedVideoType(null);
        break;
      case 'videoDetails':
        setCurrentStep('details');
        break;
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim().toLowerCase())) {
      setTags([...tags, tagInput.trim().toLowerCase()]);
      setTagInput('');
    }
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

  const handleUploadComplete = (videoId: string) => {
    setIsUploading(false);
    onUploadComplete?.(videoId);
    onClose();
    // Reset form
    setCurrentStep('map');
    setSelectedMap(null);
    setSelectedCategory(null);
    setSelectedSection(null);
    setSelectedSide(null);
    setSelectedVideoType(null);
    setTitle('');
    setPositionName('');
    setDifficulty('easy');
    setTags([]);
    setTagInput('');
    setEssential(false);
    setVideoDetails([]);
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'map':
        return 'Select Map';
      case 'category':
        return 'Select Category';
      case 'section':
        return 'Select Category Section';
      case 'side':
        return 'Select Side';
      case 'videoType':
        return 'Select Video Type';
      case 'details':
        return 'Video Details';
      case 'videoDetails':
        return 'Video Details';
      default:
        return 'Upload Video';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'map':
        return 'Choose the map for your video';
      case 'category':
        return `Choose a category for ${selectedMap?.name}`;
      case 'section':
        return `Choose a section for ${selectedCategory?.name}`;
      case 'side':
        return `Choose T or CT side for ${selectedSection?.name}`;
      case 'videoType':
        return 'Choose the type of video';
      case 'details':
        return 'Enter video details';
      case 'videoDetails':
        return 'Add images and details for this video';
      default:
        return '';
    }
  };

  const renderSelectionList = () => {
    let items: any[] = [];
    let type = '';

    switch (currentStep) {
      case 'map':
        items = maps;
        type = 'map';
        break;
      case 'category':
        items = categories;
        type = 'category';
        break;
      case 'section':
        items = sections;
        type = 'section';
        break;
      case 'side':
        items = ['T', 'CT'];
        type = 'side';
        break;
      case 'videoType':
        items = [
          { id: 'nade', name: 'Nade', type: 'nade' },
          { id: 'smoke', name: 'Smoke', type: 'smoke' },
          { id: 'fire', name: 'Fire', type: 'fire' },
          { id: 'flash', name: 'Flash', type: 'flash' },
        ];
        type = 'videoType';
        break;
    }

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    if (items.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {currentStep === 'category' && categories.length === 0
              ? 'No categories found for this map'
              :               currentStep === 'section' && sections.length === 0
              ? 'No sections found for this category'
              : currentStep === 'videoType'
              ? 'No video types available'
              : 'No items found'}
          </Text>
        </View>
      );
    }

    // Special handling for video type selection
    if (currentStep === 'videoType') {
      const videoTypes = [
        { type: 'nade' as const, name: 'Nade', image: require('@/assets/images/nade.png') },
        { type: 'smoke' as const, name: 'Smoke', image: require('@/assets/images/smoke.png') },
        { type: 'fire' as const, name: 'Fire', image: require('@/assets/images/fire.png') },
        { type: 'flash' as const, name: 'Flash', image: require('@/assets/images/flash.png') },
      ];

      return (
        <ScrollView style={styles.selectionList}>
          <View style={styles.videoTypeGrid}>
            {videoTypes.map((videoType) => (
              <TouchableOpacity
                key={videoType.type}
                style={[
                  styles.videoTypeCard,
                  selectedVideoType === videoType.type && styles.videoTypeCardSelected,
                ]}
                onPress={() => handleSelection(videoType.type, 'videoType')}
              >
                <Image
                  source={videoType.image}
                  style={styles.videoTypeIcon}
                  resizeMode="contain"
                />
                <Text style={[
                  styles.videoTypeText,
                  selectedVideoType === videoType.type && styles.videoTypeTextSelected,
                ]}>
                  {videoType.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      );
    }

    // Special handling for side selection
    if (currentStep === 'side') {
      return (
        <ScrollView style={styles.selectionList}>
          <View style={styles.sideSelectionContainer}>
            <TouchableOpacity
              style={[styles.sideButton, selectedSide === 'T' && styles.sideButtonSelected]}
              onPress={() => handleSelection('T', 'side')}
            >
              <Image
                source={require('@/assets/images/t.png')}
                style={styles.sideIcon}
                resizeMode="contain"
              />
              <Text style={[styles.sideButtonText, selectedSide === 'T' && styles.sideButtonTextSelected]}>
                T Side
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sideButton, selectedSide === 'CT' && styles.sideButtonSelected]}
              onPress={() => handleSelection('CT', 'side')}
            >
              <Image
                source={require('@/assets/images/ct.png')}
                style={styles.sideIcon}
                resizeMode="contain"
              />
              <Text style={[styles.sideButtonText, selectedSide === 'CT' && styles.sideButtonTextSelected]}>
                CT Side
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      );
    }

    return (
      <ScrollView style={styles.selectionList}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.selectionItem}
            onPress={() => handleSelection(item, type)}
          >
            <View style={styles.selectionItemContent}>
              <Text style={styles.selectionItemText}>{item.name}</Text>
              <ChevronRight size={20} color="#666" />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderDetailsForm = () => (
    <ScrollView style={styles.detailsForm}>
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
          {(['easy', 'mid', 'hard'] as const).map((diff) => (
            <TouchableOpacity
              key={diff}
              style={[
                styles.difficultyOption,
                difficulty === diff && {
                  backgroundColor: diff === 'easy' ? '#4ade80' : diff === 'mid' ? '#fbbf24' : '#f87171',
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

      <View style={styles.formGroup}>
        <Text style={styles.label}>Tags</Text>
        <View style={styles.tagInputRow}>
          <TextInput
            style={styles.tagInput}
            placeholder="Enter a tag"
            placeholderTextColor="#666"
            value={tagInput}
            onChangeText={setTagInput}
            onSubmitEditing={handleAddTag}
            editable={!isUploading}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={styles.addTagButton}
            onPress={handleAddTag}
            disabled={isUploading || !tagInput.trim()}
          >
            <Plus size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        {tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
                <TouchableOpacity
                  onPress={() => setTags(tags.filter((_, i) => i !== index))}
                  disabled={isUploading}
                >
                  <X size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.formGroup}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setEssential(!essential)}
          disabled={isUploading}
        >
          <View style={[styles.checkbox, essential && styles.checkboxChecked]}>
            {essential && <Check size={16} color="#fff" />}
          </View>
          <Text style={styles.checkboxLabel}>Mark as Essential Video</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.selectionSummary}>
        <Text style={styles.summaryTitle}>Selected Path:</Text>
        <Text style={styles.summaryText}>
          {selectedMap?.name} → {selectedCategory?.name} → {selectedSection?.name} → {selectedSide} Side → {selectedVideoType || 'Select Type'}
        </Text>
      </View>
    </ScrollView>
  );

  const renderVideoDetailsForm = () => (
    <ScrollView style={styles.detailsForm}>
      <VideoDetailsForm
        initialDetails={videoDetails}
        onDetailsChange={setVideoDetails}
      />
    </ScrollView>
  );

  const renderContent = () => {
    if (currentStep === 'details') {
      return renderDetailsForm();
    }
    if (currentStep === 'videoDetails') {
      return renderVideoDetailsForm();
    }
    return renderSelectionList();
  };

  const renderFooter = () => {
    if (currentStep === 'details') {
      return (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.nextButton} onPress={() => setCurrentStep('videoDetails')}>
            <Text style={styles.nextButtonText}>Add Video Details</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (currentStep === 'videoDetails') {
      return (
        <View style={styles.footer}>
          {isUploading ? (
            <VideoUpload
              mapId={selectedMap?.id || ''}
              categorySectionId={selectedSection?.id}
              side={selectedSide || undefined}
              videoType={selectedVideoType || undefined}
              title={title}
              positionName={positionName}
              difficulty={difficulty}
              videoDetails={videoDetails}
              tags={tags}
              essential={essential}
              onUploadComplete={handleUploadComplete}
            />
          ) : (
            <TouchableOpacity style={styles.startButton} onPress={handleStartUpload}>
              <Text style={styles.startButtonText}>Start Upload</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return null;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {currentStep !== 'map' && (
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                  <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.title}>{getStepTitle()}</Text>
            <TouchableOpacity onPress={onClose} disabled={isUploading}>
              <X size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.description}>{getStepDescription()}</Text>

          {renderContent()}
          {renderFooter()}
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
  headerLeft: {
    flex: 1,
  },
  backButton: {
    paddingVertical: 4,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 2,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  selectionList: {
    maxHeight: 300,
  },
  selectionItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  selectionItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectionItemText: {
    color: '#fff',
    fontSize: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#999',
    fontSize: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  detailsForm: {
    paddingHorizontal: 20,
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
  sideSelectionContainer: {
    gap: 16,
    paddingVertical: 8,
  },
  sideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#333',
    gap: 16,
  },
  sideButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#001AFF20',
  },
  sideIcon: {
    width: 40,
    height: 40,
  },
  sideButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  sideButtonTextSelected: {
    color: '#007AFF',
  },
  videoTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingVertical: 8,
    justifyContent: 'space-between',
  },
  videoTypeCard: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  videoTypeCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#001AFF20',
  },
  videoTypeIcon: {
    width: 50,
    height: 50,
    marginBottom: 12,
  },
  videoTypeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  videoTypeTextSelected: {
    color: '#007AFF',
  },
  selectionSummary: {
    backgroundColor: '#0a0a0a',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  summaryTitle: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  summaryText: {
    color: '#fff',
    fontSize: 16,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  startButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextButton: {
    backgroundColor: '#333',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  tagInput: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
  },
  addTagButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  tagText: {
    color: '#fff',
    fontSize: 14,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#666',
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkboxLabel: {
    color: '#fff',
    fontSize: 16,
  },
});
