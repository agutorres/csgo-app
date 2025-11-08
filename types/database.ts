export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Difficulty = 'easy' | 'mid' | 'hard';

export interface Database {
  public: {
    Tables: {
      maps: {
        Row: {
          id: string;
          name: string;
          thumbnail_url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          thumbnail_url: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          thumbnail_url?: string;
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          map_id: string;
          name: string;
          thumbnail_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          map_id: string;
          name: string;
          thumbnail_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          map_id?: string;
          name?: string;
          thumbnail_url?: string | null;
          created_at?: string;
        };
      };
      category_sections: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          thumbnail_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          thumbnail_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          name?: string;
          thumbnail_url?: string | null;
          created_at?: string;
        };
      };
      videos: {
        Row: {
          id: string;
          map_id: string;
          category_section_id: string | null;
          side: 'T' | 'CT' | null;
          title: string;
          video_url: string | null;
          difficulty: Difficulty;
          position_name: string;
          created_at: string;
          mux_asset_id: string | null;
          mux_playback_id: string | null;
          mux_upload_id: string | null;
          mux_status: 'pending' | 'processing' | 'ready' | 'errored';
          thumbnail_url: string | null;
          duration_seconds: number | null;
          file_size_bytes: number | null;
          map_image: string | null;
          essential: boolean;
          video_type: 'nade' | 'smoke' | 'fire' | 'flash' | null;
          tags: string[] | null;
        };
        Insert: {
          id?: string;
          map_id: string;
          category_section_id?: string | null;
          side?: 'T' | 'CT' | null;
          title: string;
          video_url?: string | null;
          difficulty: Difficulty;
          position_name: string;
          created_at?: string;
          mux_asset_id?: string | null;
          mux_playback_id?: string | null;
          mux_upload_id?: string | null;
          mux_status?: 'pending' | 'processing' | 'ready' | 'errored';
          thumbnail_url?: string | null;
          duration_seconds?: number | null;
          file_size_bytes?: number | null;
          map_image?: string | null;
          essential?: boolean;
          video_type?: 'nade' | 'smoke' | 'fire' | 'flash' | null;
          tags?: string[] | null;
        };
        Update: {
          id?: string;
          map_id?: string;
          category_section_id?: string | null;
          side?: 'T' | 'CT' | null;
          title?: string;
          video_url?: string | null;
          difficulty?: Difficulty;
          position_name?: string;
          created_at?: string;
          mux_asset_id?: string | null;
          mux_playback_id?: string | null;
          mux_upload_id?: string | null;
          mux_status?: 'pending' | 'processing' | 'ready' | 'errored';
          thumbnail_url?: string | null;
          duration_seconds?: number | null;
          file_size_bytes?: number | null;
          map_image?: string | null;
          essential?: boolean;
          video_type?: 'nade' | 'smoke' | 'fire' | 'flash' | null;
          tags?: string[] | null;
        };
      };
      callouts: {
        Row: {
          id: string;
          map_id: string;
          name: string;
          image_url: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          map_id: string;
          name: string;
          image_url: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          map_id?: string;
          name?: string;
          image_url?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          video_id: string;
          user_id: string;
          text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          video_id: string;
          user_id: string;
          text: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          video_id?: string;
          user_id?: string;
          text?: string;
          created_at?: string;
        };
      };
      user_favorites: {
        Row: {
          id: string;
          user_id: string;
          video_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          video_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          video_id?: string;
          created_at?: string;
        };
      };
      video_details: {
        Row: {
          id: string;
          video_id: string;
          name: string;
          image_url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          video_id: string;
          name: string;
          image_url: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          video_id?: string;
          name?: string;
          image_url?: string;
          created_at?: string;
        };
      };
    };
    Functions: {
      create_default_video_details: {
        Args: {
          video_id_param: string;
        };
        Returns: void;
      };
    };
  };
}
