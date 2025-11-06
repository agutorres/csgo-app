// Supabase webhook handler to update video records when Mux processing is complete
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for server-side operations
);

async function updateVideoWithMuxAsset(videoId, muxAssetId) {
  try {
    // Get Mux asset details
    const response = await fetch(`http://fps-guide-api.vercel.app/api/mux/asset/${muxAssetId}`);
    const { asset } = await response.json();
    
    if (!asset) {
      throw new Error('Asset not found');
    }

    // Update video record with Mux details
    const updates = {
      mux_asset_id: muxAssetId,
      mux_playback_id: asset.playback_ids?.[0]?.id || null,
      mux_status: asset.status === 'ready' ? 'ready' : 'processing',
      thumbnail_url: asset.thumbnail || null,
      duration_seconds: asset.duration ? Math.round(asset.duration) : null,
      file_size_bytes: asset.size || null,
    };

    const { error } = await supabase
      .from('videos')
      .update(updates)
      .eq('id', videoId);

    if (error) {
      console.error('Error updating video:', error);
      return false;
    }

    console.log(`Updated video ${videoId} with Mux asset ${muxAssetId}`);
    return true;
  } catch (error) {
    console.error('Error in updateVideoWithMuxAsset:', error);
    return false;
  }
}

module.exports = { updateVideoWithMuxAsset };
