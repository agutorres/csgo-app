import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { Trash2, ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';

type Comment = Database['public']['Tables']['comments']['Row'];

interface CommentWithDetails extends Comment {
  video_title?: string;
  map_name?: string;
}

export default function AdminCommentsScreen() {
  const [comments, setComments] = useState<CommentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    if (user && isAdmin) {
      fetchComments();
    } else if (user && !isAdmin) {
      alert('Access denied. Admin privileges required.');
      router.replace('/(tabs)');
    } else {
      router.replace('/(tabs)');
    }
  }, [user, isAdmin]);

  async function fetchComments() {
    try {
      setLoading(true);

      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;

      const { data: videosData } = await supabase.from('videos').select('id, title, map_id');
      const { data: mapsData } = await supabase.from('maps').select('id, name');

      const commentsWithDetails = (commentsData || []).map((comment) => {
        const video = videosData?.find((v) => v.id === comment.video_id);
        const map = mapsData?.find((m) => m.id === video?.map_id);
        return {
          ...comment,
          video_title: video?.title,
          map_name: map?.name,
        };
      });

      setComments(commentsWithDetails);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      const { error } = await supabase.from('comments').delete().eq('id', id);
      if (error) throw error;
      await fetchComments();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete comment');
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString();
  }

  function renderCommentItem({ item }: { item: CommentWithDetails }) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.metaInfo}>
            {item.map_name && <Text style={styles.mapBadge}>{item.map_name}</Text>}
            <Text style={styles.timestamp}>{formatDate(item.created_at)}</Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id)}>
            <Trash2 size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        {item.video_title && (
          <Text style={styles.videoTitle}>Video: {item.video_title}</Text>
        )}

        <Text style={styles.commentText}>{item.text}</Text>

        <Text style={styles.userId}>User ID: {item.user_id.slice(0, 8)}...</Text>
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
        <Text style={styles.title}>Manage Comments</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={comments}
        renderItem={renderCommentItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No comments yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222128',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222128',
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
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#1a1a20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  metaInfo: {
    flex: 1,
  },
  mapBadge: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  timestamp: {
    color: '#666',
    fontSize: 11,
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoTitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  commentText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 22,
    marginBottom: 12,
  },
  userId: {
    fontSize: 11,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
});
