import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { X } from 'lucide-react-native';

interface RewardedAdModalProps {
  visible: boolean;
  onClose: () => void;
  onWatchAd: () => Promise<void>;
}

export default function RewardedAdModal({
  visible,
  onClose,
  onWatchAd,
}: RewardedAdModalProps) {
  const [loading, setLoading] = useState(false);

  const handleWatchAd = async () => {
    setLoading(true);
    try {
      await onWatchAd();
      onClose();
    } catch (error) {
      console.error('Error showing rewarded ad:', error);
      // Still close the modal even if ad fails
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.content}>
            <Text style={styles.title}>Unlock Ad-Free Experience</Text>
            <Text style={styles.description}>
              Watch a short video ad to unlock 1 hour of ad-free video viewing!
            </Text>

            <View style={styles.benefitsContainer}>
              <Text style={styles.benefitText}>✓ No ads before videos</Text>
              <Text style={styles.benefitText}>✓ Uninterrupted viewing</Text>
              <Text style={styles.benefitText}>✓ Full 1 hour access</Text>
            </View>

            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={[styles.button, styles.skipButton]}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.skipButtonText}>Maybe Later</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.watchButton, loading && styles.watchButtonDisabled]}
                onPress={handleWatchAd}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.watchButtonText}>Watch Ad</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#1a1a20',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#2a2a30',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 1,
  },
  content: {
    marginTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  benefitsContainer: {
    backgroundColor: '#222128',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  benefitText: {
    fontSize: 15,
    color: '#fff',
    marginBottom: 8,
    paddingLeft: 8,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    backgroundColor: '#2a2a30',
    borderWidth: 1,
    borderColor: '#3a3a40',
  },
  skipButtonText: {
    color: '#ccc',
    fontSize: 16,
    fontWeight: '600',
  },
  watchButton: {
    backgroundColor: '#fff',
  },
  watchButtonDisabled: {
    opacity: 0.6,
  },
  watchButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

