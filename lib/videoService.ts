import { getMuxPlaybackUrl } from './mux';
import { supabase } from './supabase';
import { Database } from '@/types/database';

type Video = Database['public']['Tables']['videos']['Row'];
type VideoInsert = Database['public']['Tables']['videos']['Insert'];
type VideoUpdate = Database['public']['Tables']['videos']['Update'];

export class VideoService {
  static async createVideo(videoData: VideoInsert): Promise<Video> {
    const { data, error } = await supabase
      .from('videos')
      .insert(videoData)
      .select()
      .single();

    if (error) throw new Error(`Failed to create video: ${error.message}`);
    return data;
  }

  static async getVideo(id: string): Promise<Video | null> {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('id', id)
      .single();

    if (error?.code === 'PGRST116') return null;
    if (error) throw new Error(`Failed to get video: ${error.message}`);
    return data;
  }

  static async getVideosByMap(mapId: string): Promise<Video[]> {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('map_id', mapId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to get videos: ${error.message}`);
    return data || [];
  }

  static async updateVideo(id: string, updates: VideoUpdate): Promise<Video> {
    const { data, error } = await supabase
      .from('videos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update video: ${error.message}`);
    return data;
  }

  // --- The following logic is frontend-safe only (just URL building, etc) ---

  static getVideoPlaybackUrl(video: Video): string | null {
    if (video.mux_playback_id) {
      return getMuxPlaybackUrl(video.mux_playback_id);
    }
    return video.video_url;
  }

  static isVideoReady(video: Video): boolean {
    return video.mux_status === 'ready' && !!video.mux_playback_id;
  }

  static getVideoThumbnail(video: Video): string | null {
    if (video.thumbnail_url) {
      return video.thumbnail_url;
    }
    if (video.mux_playback_id) {
      return `https://image.mux.com/${video.mux_playback_id}/thumbnail.jpg?time=0`;
    }
    return null;
  }

  // Get Mux playback ID from video
  static getMuxPlaybackId(video: Video): string | null {
    if (video.mux_playback_id) {
      return video.mux_playback_id;
    }
    
    // Extract playback ID from video_url if it's a Mux URL
    if (video.video_url && video.video_url.includes('stream.mux.com/')) {
      const match = video.video_url.match(/stream\.mux\.com\/([^\.]+)\.m3u8/);
      return match ? match[1] : null;
    }
    
    return null;
  }

  // Check if video has any playable content
  static hasPlayableContent(video: Video): boolean {
    return !!(video.mux_playback_id || 
              (video.video_url && video.video_url.includes('stream.mux.com/')) ||
              (video.video_url && video.video_url.includes('.m3u8')));
  }
}

// If you need to create uploads or interact with assets, use fetch('/api/mux/upload', ...) etc.
