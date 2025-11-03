import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { X } from 'lucide-react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ImageViewerModalProps {
  visible: boolean;
  imageUrl: string | null;
  onClose: () => void;
}

export default function ImageViewerModal({ visible, imageUrl, onClose }: ImageViewerModalProps) {
  const [imageScale, setImageScale] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleDoubleTap = () => {
    setImageScale(imageScale === 1 ? 2 : 1);
  };

  const handleClose = () => {
    setImageScale(1);
    setImageLoaded(false);
    onClose();
  };

  useEffect(() => {
    if (visible) {
      setImageLoaded(false);
      
      // FAILSAFE: Auto-close after 30 seconds if something goes wrong
      const timeout = setTimeout(() => {
        handleClose();
      }, 30000);
      
      return () => clearTimeout(timeout);
    }
  }, [visible]);

  // Don't render at all if not visible to prevent blocking UI
  if (!visible || !imageUrl) {
    return null;
  }

  // For iOS/Android: Use absolute positioned overlay (Modal doesn't work with nested modals)
  // For Web: Use Modal component
  if (Platform.OS !== 'web') {
    return (
      <View style={styles.absoluteOverlay}>
        <TouchableOpacity 
          style={styles.container}
          activeOpacity={1}
          onPress={handleClose}
        >
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={handleClose}
        >
          <X size={28} color="#000" />
        </TouchableOpacity>
        
        <Text style={styles.hint}>Tap anywhere to close • Double tap image to zoom</Text>
        
        {imageUrl ? (
          <TouchableOpacity
            onPress={handleDoubleTap}
            activeOpacity={1}
            style={styles.imageContainer}
          >
            {!imageLoaded && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.loadingText}>Loading image...</Text>
              </View>
            )}
            <Image 
              source={{ uri: imageUrl }} 
              style={[
                styles.image, 
                { transform: [{ scale: imageScale }] },
                !imageLoaded && styles.hiddenImage
              ]}
              resizeMode="contain"
              onError={() => {
                Alert.alert('Error', 'Failed to load image');
                handleClose();
              }}
              onLoad={() => {
                setImageLoaded(true);
              }}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}
        </TouchableOpacity>
      </View>
    );
  }

  // Web version: Use Modal component
  return (
    <Modal
      visible={true}
      transparent={false}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <TouchableOpacity 
        style={styles.container}
        activeOpacity={1}
        onPress={handleClose}
      >
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={handleClose}
        >
          <X size={28} color="#000" />
        </TouchableOpacity>
        
        <Text style={styles.hint}>Tap anywhere to close • Double tap image to zoom</Text>
        
        {imageUrl ? (
          <TouchableOpacity
            onPress={handleDoubleTap}
            activeOpacity={1}
            style={styles.imageContainer}
          >
            {!imageLoaded && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.loadingText}>Loading image...</Text>
              </View>
            )}
            <Image 
              source={{ uri: imageUrl }} 
              style={[
                styles.image, 
                { transform: [{ scale: imageScale }] },
                !imageLoaded && styles.hiddenImage
              ]}
              resizeMode="contain"
              onError={() => {
                Alert.alert('Error', 'Failed to load image');
                handleClose();
              }}
              onLoad={() => {
                setImageLoaded(true);
              }}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  absoluteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999999,
    elevation: 999,
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  hint: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    textAlign: 'center',
    color: '#fff',
    fontSize: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    borderRadius: 8,
  },
  imageContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: screenWidth - 40,
    height: screenHeight - 200,
  },
  hiddenImage: {
    opacity: 0,
  },
  loadingContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
});

