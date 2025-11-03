import { VideoService } from './videoService';
import { supabase } from './supabase';

// Mux webhook event types
interface MuxWebhookEvent {
  type: string;
  data: {
    id: string;
    type: string;
    status?: string;
    playback_ids?: Array<{ id: string; policy: string }>;
    duration?: number;
    size?: number;
    thumbnail?: string;
  };
}

// Handle Mux webhook events
export async function handleMuxWebhook(event: MuxWebhookEvent) {
  try {
    console.log('Received Mux webhook:', event);

    switch (event.type) {
      case 'video.asset.ready':
        await handleAssetReady(event.data);
        break;
      case 'video.asset.errored':
        await handleAssetErrored(event.data);
        break;
      case 'video.upload.cancelled':
        await handleUploadCancelled(event.data);
        break;
      default:
        console.log('Unhandled Mux webhook event type:', event.type);
    }
  } catch (error) {
    console.error('Error handling Mux webhook:', error);
    throw error;
  }
}

// Handle when a Mux asset is ready
async function handleAssetReady(assetData: MuxWebhookEvent['data']) {
  const { id: assetId, playback_ids, duration, size, thumbnail } = assetData;
  
  // Find video by Mux asset ID
  const { data: videos, error } = await supabase
    .from('videos')
    .select('*')
    .eq('mux_asset_id', assetId);

  if (error) {
    console.error('Error finding video by Mux asset ID:', error);
    return;
  }

  if (!videos || videos.length === 0) {
    console.log('No video found for Mux asset ID:', assetId);
    return;
  }

  const video = videos[0];
  
  // Update video with Mux asset details
  await VideoService.updateVideoWithMuxAsset(video.id, assetId);
  
  console.log('Updated video with Mux asset details:', video.id);
}

// Handle when a Mux asset has an error
async function handleAssetErrored(assetData: MuxWebhookEvent['data']) {
  const { id: assetId } = assetData;
  
  // Find video by Mux asset ID
  const { data: videos, error } = await supabase
    .from('videos')
    .select('*')
    .eq('mux_asset_id', assetId);

  if (error) {
    console.error('Error finding video by Mux asset ID:', error);
    return;
  }

  if (!videos || videos.length === 0) {
    console.log('No video found for Mux asset ID:', assetId);
    return;
  }

  const video = videos[0];
  
  // Update video status to errored
  await VideoService.updateVideo(video.id, { mux_status: 'errored' });
  
  console.log('Marked video as errored:', video.id);
}

// Handle when a Mux upload is cancelled
async function handleUploadCancelled(uploadData: MuxWebhookEvent['data']) {
  const { id: uploadId } = uploadData;
  
  // Find video by Mux upload ID
  const { data: videos, error } = await supabase
    .from('videos')
    .select('*')
    .eq('mux_upload_id', uploadId);

  if (error) {
    console.error('Error finding video by Mux upload ID:', error);
    return;
  }

  if (!videos || videos.length === 0) {
    console.log('No video found for Mux upload ID:', uploadId);
    return;
  }

  const video = videos[0];
  
  // Delete the video record since upload was cancelled
  const { error: deleteError } = await supabase
    .from('videos')
    .delete()
    .eq('id', video.id);

  if (deleteError) {
    console.error('Error deleting cancelled video:', deleteError);
    return;
  }
  
  console.log('Deleted cancelled video:', video.id);
}

// Verify Mux webhook signature (for production use)
export function verifyMuxWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // In production, you should verify the webhook signature
  // This is a simplified version - implement proper signature verification
  return true;
}
