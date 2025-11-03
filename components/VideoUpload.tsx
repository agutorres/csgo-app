import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import * as DocumentPicker from 'expo-document-picker';

// Change 'YOUR_LOCAL_IP' to your actual machine's LAN IP for mobile testing
const BACKEND_API_URL =
  Platform.OS === 'web'
    ? 'http://localhost:3001'
    : 'http://YOUR_LOCAL_IP:3001';

interface VideoDetail {
  id?: string;
  name: string;
  image_url: string;
}

interface VideoUploadProps {
  mapId: string;
  title?: string;
  positionName?: string;
  difficulty?: 'easy' | 'mid' | 'hard';
  categorySectionId?: string;
  side?: 'T' | 'CT';
  videoType?: 'nade' | 'smoke' | 'fire' | 'flash';
  videoDetails?: VideoDetail[];
  onUploadComplete?: (videoId: string) => void;
}

export default function VideoUpload({ 
  mapId, 
  title = 'New Video',
  positionName = 'Unknown Position',
  difficulty = 'easy',
  categorySectionId,
  side,
  videoType,
  videoDetails = [],
  onUploadComplete 
}: VideoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');

  const handleVideoUpload = async () => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadStatus('Selecting video file...');

      // Step 1: Pick video file
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setIsUploading(false);
        return;
      }

      setUploadStatus('Creating Mux upload...');
      setUploadProgress(10);

      // Step 2: Create Mux upload
      const uploadRes = await fetch(`${BACKEND_API_URL}/api/mux/upload`, { 
        method: 'POST' 
      });
      if (!uploadRes.ok) throw new Error('Failed to create Mux upload');
      const { upload } = await uploadRes.json();

      setUploadStatus('Creating video record...');
      setUploadProgress(20);

      // Step 3: Create video record in Supabase
      const { data: video, error: videoError } = await supabase
        .from('videos')
        .insert({
          map_id: mapId,
          category_section_id: categorySectionId,
          side: side,
          video_type: videoType,
          title: title || result.assets[0].name || 'New Video',
          difficulty: difficulty,
          position_name: positionName,
          mux_upload_id: upload.id,
          mux_status: 'pending',
        })
        .select()
        .single();

      if (videoError) throw new Error(`Failed to create video record: ${videoError.message}`);

      // Step 3.5: Create video details (only non-empty ones)
      // Filter out details with empty image_url to avoid duplicates
      const validDetails = videoDetails.filter(detail => detail.image_url && detail.image_url.trim());
      
      if (validDetails.length > 0) {
        const { error: detailsError } = await supabase
          .from('video_details')
          .insert(
            validDetails.map(detail => ({
              video_id: video.id,
              name: detail.name,
              image_url: detail.image_url
            }))
          );

        if (detailsError) {
          console.error('Failed to create video details:', detailsError);
          // Don't throw error here as video creation is more important
        }
      }

      setUploadStatus('Uploading video to Mux...');
      setUploadProgress(30);

      // Step 4: Upload file to Mux
      const file = await fetch(result.assets[0].uri);
      const blob = await file.blob();

      const uploadToMuxRes = await fetch(upload.url, {
        method: 'PUT',
        headers: {
          'Content-Type': result.assets[0].mimeType || 'video/mp4',
        },
        body: blob,
      });

      if (!uploadToMuxRes.ok) {
        throw new Error('Failed to upload video to Mux');
      }

      // Step 5: Update video status to processing
      setUploadStatus('Processing on Mux...');
      setUploadProgress(90);

      await supabase
        .from('videos')
        .update({ mux_status: 'processing' })
        .eq('id', video.id);

      // Step 6: Start polling Mux for processed asset
      const checkMuxStatus = async () => {
        try {
          const res = await fetch(`${BACKEND_API_URL}/api/mux/status/${upload.id}`);
          const data = await res.json();

          console.log('Mux status check result:', data);
          
          if (data.playbackId) {
            console.log('Asset is ready! Updating video with Mux details...');
            // Mux asset is ready - update video with asset details
            const { error: updateError } = await supabase
              .from('videos')
              .update({
                mux_asset_id: data.assetId,
                mux_playback_id: data.playbackId,
                mux_status: 'ready',
                video_url: `https://stream.mux.com/${data.playbackId}.m3u8`,
                thumbnail_url: data.thumbnail || null,
                duration_seconds: data.duration ? Math.round(data.duration) : null,
                file_size_bytes: data.file_size || null,
              })
              .eq('id', video.id);

            if (updateError) {
              console.error('Error updating video with Mux details:', updateError);
            } else {
              console.log('Successfully updated video with Mux details');
            }

            clearInterval(interval);
            setUploadStatus('Complete!');
            setUploadProgress(100);

            Alert.alert(
              'Upload Complete!',
              'Video uploaded and processed successfully! It\'s now ready for playback.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    setIsUploading(false);
                    setUploadProgress(0);
                    setUploadStatus('');
                    onUploadComplete?.(video.id);
                  }
                }
              ]
            );
            return;
          }
        } catch (error) {
          console.error('Error checking Mux status:', error);
        }
      };

      // Poll every 3 seconds for up to 5 minutes
      const interval = setInterval(checkMuxStatus, 3000);
      setTimeout(() => {
        clearInterval(interval);
        if (uploadProgress < 100) {
          setUploadStatus('Processing taking longer than expected...');
        }
      }, 300000); // 5 minutes timeout
    } catch (error: any) {
      console.error('Video upload error:', error);
      Alert.alert('Upload Error', `Failed to upload video: ${error.message}`);
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatus('');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
        onPress={handleVideoUpload}
        disabled={isUploading}
      >
        <Text style={styles.uploadButtonText}>
          {isUploading ? 'Uploading...' : 'Upload Video'}
        </Text>
      </TouchableOpacity>

      {isUploading && (
        <View style={styles.progressContainer}>
          <Text style={styles.statusText}>{uploadStatus}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
          </View>
          <Text style={styles.progressText}>{uploadProgress}%</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  uploadButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
});