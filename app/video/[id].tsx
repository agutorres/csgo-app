import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Dimensions,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Database, Difficulty } from '@/types/database';
import { ChevronLeft, Send, MessageSquare, X } from 'lucide-react-native';
import MuxVideoPlayer from '@/components/MuxVideoPlayer';
import VideoExpandModal from '@/components/VideoExpandModal';
import { VideoService } from '@/lib/videoService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type Video = Database['public']['Tables']['videos']['Row'];
type Comment = Database['public']['Tables']['comments']['Row'];

interface CommentWithEmail extends Comment {
  user_email?: string;
}

export default function VideoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<CommentWithEmail[]>([]);
  const [commentText, setCommentText] = useState('');
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    if (id) {
      fetchVideoAndComments();
    }
  }, [id]);

  async function fetchVideoAndComments() {
    try {
      setLoading(true);
      setError(null);

      const videoData = await VideoService.getVideo(id!);
      if (!videoData) throw new Error('Video not found');

      console.log('Video data:', videoData);
      console.log('Mux playback ID:', videoData.mux_playback_id);
      console.log('Video URL:', videoData.video_url);
      console.log('Mux status:', videoData.mux_status);
      console.log('Is video ready:', VideoService.isVideoReady(videoData));
      console.log('Mux playback ID from service:', VideoService.getMuxPlaybackId(videoData));

      setVideo(videoData);

      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('video_id', id)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;
      setComments(commentsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load video');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitComment() {
    if (!user) {
      alert('Please sign in to leave comments');
      return;
    }

    if (!commentText.trim()) {
      return;
    }

    try {
      setSubmitting(true);

      const { data, error: insertError } = await supabase
        .from('comments')
        .insert({
          video_id: id,
          user_id: user.id,
          text: commentText.trim(),
        } as any)
        .select()
        .single();

      if (insertError) throw insertError;

      setComments([data, ...comments]);
      setCommentText('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  }

  function getDifficultyColor(difficulty: Difficulty) {
    switch (difficulty) {
      case 'easy':
        return '#4ade80';
      case 'mid':
        return '#fbbf24';
      case 'hard':
        return '#f87171';
      default:
        return '#fff';
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  }

  function renderComment({ item }: { item: CommentWithEmail }) {
    const isOwnComment = user && item.user_id === user.id;

    return (
      <View style={styles.commentCard}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentUser}>
            {isOwnComment ? 'You' : `User ${item.user_id.slice(0, 8)}`}
          </Text>
          <Text style={styles.commentTime}>{formatDate(item.created_at)}</Text>
        </View>
        <Text style={styles.commentText}>{item.text}</Text>
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

  if (error || !video) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Video not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Fullscreen Video */}
      <View style={styles.fullscreenVideo}>
        {VideoService.hasPlayableContent(video) ? (
          <MuxVideoPlayer
            playbackId={VideoService.getMuxPlaybackId(video) || video.mux_playback_id || ''}
            autoPlay={true}
            controls={true}
            fullscreen={true}
          />
        ) : (
          <View style={styles.videoPlaceholder}>
            <Text style={styles.videoPlaceholderText}>
              {video.mux_status === 'processing' ? 'Processing Video...' : 
               video.mux_status === 'pending' ? 'Uploading Video...' : 'Video Not Ready'}
            </Text>
            {video.mux_status === 'errored' && (
              <Text style={styles.errorText}>Video processing failed</Text>
            )}
            {video.mux_status === 'processing' && (
              <Text style={styles.processingText}>
                This usually takes 1-2 minutes. Please wait...
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Video Overlay Controls */}
      <View style={styles.videoOverlay}>
        <View style={styles.topControls}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.videoInfo}>
            <View
              style={[
                styles.difficultyBadge,
                { backgroundColor: getDifficultyColor(video.difficulty) },
              ]}>
              <Text style={styles.difficultyText}>{video.difficulty.toUpperCase()}</Text>
            </View>
            <Text style={styles.videoTitle}>{video.title}</Text>
            <Text style={styles.videoPosition}>{video.position_name}</Text>
          </View>
        </View>

        <View style={styles.bottomControls}>
          <TouchableOpacity 
            style={styles.commentsButton} 
            onPress={() => setShowComments(true)}>
            <MessageSquare size={20} color="#fff" />
            <Text style={styles.commentsButtonText}>
              Comments ({comments.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Comments Modal */}
      <Modal
        visible={showComments}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowComments(false)}>
        <View style={styles.commentsModal}>
          <View style={styles.commentsHeader}>
            <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setShowComments(false)}>
              <X size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            style={styles.commentsContent}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}>
            <FlatList
              data={comments}
              renderItem={renderComment}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.commentsList}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No comments yet. Be the first!</Text>
                </View>
              }
            />

            <View style={styles.inputContainer}>
              {user ? (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Add a comment..."
                    placeholderTextColor="#666"
                    value={commentText}
                    onChangeText={setCommentText}
                    multiline
                    maxLength={500}
                  />
                  <TouchableOpacity
                    style={[styles.sendButton, !commentText.trim() && styles.sendButtonDisabled]}
                    onPress={handleSubmitComment}
                    disabled={submitting || !commentText.trim()}>
                    {submitting ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <Send size={20} color={commentText.trim() ? '#000' : '#666'} />
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.signInPrompt}
                  onPress={() => {
                    alert('Please go to the Profile tab to sign in');
                  }}>
                  <Text style={styles.signInPromptText}>Sign in to leave comments</Text>
                </TouchableOpacity>
              )}
            </View>
          </KeyboardAvoidingView>
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
    paddingBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  videoContainer: {
    backgroundColor: '#1a1a1a',
    aspectRatio: 16 / 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
    flex: 1,
  },
  videoPlaceholder: {
    alignItems: 'center',
  },
  videoPlaceholderText: {
    color: '#666',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  videoUrl: {
    color: '#444',
    fontSize: 12,
  },
  videoInfo: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 12,
  },
  difficultyText: {
    color: '#000',
    fontSize: 11,
    fontWeight: 'bold',
  },
  videoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  videoPosition: {
    fontSize: 14,
    color: '#999',
  },
  commentsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  commentsList: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  commentCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  commentUser: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  commentTime: {
    fontSize: 12,
    color: '#666',
  },
  commentText: {
    fontSize: 14,
    color: '#ddd',
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#1a1a1a',
  },
  signInPrompt: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  signInPromptText: {
    color: '#666',
    fontSize: 14,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  processingText: {
    color: '#999',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Fullscreen Video Styles
  fullscreenVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    width: '100%',
    height: '100%',
  },
  // Video Overlay Styles
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  topControls: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bottomControls: {
    alignItems: 'center',
  },
  commentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  commentsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Comments Modal Styles
  commentsModal: {
    flex: 1,
    backgroundColor: '#000',
  },
  commentsContent: {
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
});
