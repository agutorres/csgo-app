import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export function useFavorites() {
  const { user } = useAuth();
  const [favoriteVideoIds, setFavoriteVideoIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Fetch user's favorite video IDs
  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setFavoriteVideoIds(new Set());
    }
  }, [user]);

  async function fetchFavorites() {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_favorites')
        .select('video_id')
        .eq('user_id', user.id);

      if (error) throw error;

      const videoIds = new Set(data?.map(fav => fav.video_id) || []);
      setFavoriteVideoIds(videoIds);
    } catch (err) {
      console.error('Error fetching favorites:', err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleFavorite(videoId: string): Promise<boolean> {
    if (!user) return false;

    try {
      const isCurrentlyFavorite = favoriteVideoIds.has(videoId);

      if (isCurrentlyFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('video_id', videoId);

        if (error) throw error;

        setFavoriteVideoIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(videoId);
          return newSet;
        });

        return false; // Now unfavorited
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: user.id,
            video_id: videoId,
          });

        if (error) throw error;

        setFavoriteVideoIds(prev => new Set([...prev, videoId]));
        return true; // Now favorited
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      return favoriteVideoIds.has(videoId); // Return current state on error
    }
  }

  function isFavorite(videoId: string): boolean {
    return favoriteVideoIds.has(videoId);
  }

  return {
    favoriteVideoIds,
    loading,
    toggleFavorite,
    isFavorite,
    refreshFavorites: fetchFavorites,
  };
}



