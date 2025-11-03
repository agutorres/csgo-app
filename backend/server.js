const express = require('express');
const Mux = require('@mux/mux-node');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

// Supabase client for server-side operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Create Mux upload
app.post('/api/mux/upload', async (req, res) => {
  try {
    const upload = await mux.video.uploads.create({
      new_asset_settings: {
        "max_resolution_tier": "2160p",
        "normalize_audio": false,
        "playback_policies": [
          "public"
        ],
        "video_quality": "basic"
      },
      cors_origin: '*',
    });
    res.json({ upload });
  } catch (e) {
    console.error('Mux upload creation error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Get Mux asset details
app.get('/api/mux/asset/:assetId', async (req, res) => {
  try {
    const asset = await mux.video.assets.retrieve(req.params.assetId);
    res.json({ asset });
  } catch (e) {
    console.error('Mux asset retrieval error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Mux webhook handler
app.post('/api/mux/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const event = JSON.parse(req.body);
    console.log('Received Mux webhook:', event.type);
    
    if (event.type === 'video.asset.ready') {
      const { id: assetId, playback_ids, duration, size, thumbnail } = event.data;
      
      console.log('Asset ready:', {
        assetId,
        playbackId: playback_ids?.[0]?.id,
        duration,
        size,
        thumbnail
      });

      // Find video by Mux asset ID and update it
      const { data: videos, error: videoError } = await supabase
        .from('videos')
        .select('*')
        .eq('mux_asset_id', assetId);

      if (videoError) {
        console.error('Error finding video by asset ID:', videoError);
      } else if (videos && videos.length > 0) {
        const video = videos[0];
        
        // Update video with Mux asset details
        const updates = {
          mux_playback_id: playback_ids?.[0]?.id || null,
          mux_status: 'ready',
          thumbnail_url: thumbnail || null,
          duration_seconds: duration ? Math.round(duration) : null,
          file_size_bytes: size || null,
        };

        const { error: updateError } = await supabase
          .from('videos')
          .update(updates)
          .eq('id', video.id);

        if (updateError) {
          console.error('Error updating video:', updateError);
        } else {
          console.log(`Successfully updated video ${video.id} with Mux asset details`);
        }
      } else {
        console.log('No video found for asset ID:', assetId);
      }
    }
    
    res.status(200).send('OK');
  } catch (e) {
    console.error('Webhook processing error:', e);
    res.status(500).send('Error');
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/mux/status/:uploadId', async (req, res) => {
  try {
    const { uploadId } = req.params;
    
    // Get upload information using the correct Mux SDK method
    const upload = await mux.video.uploads.retrieve(uploadId);
    console.log('Upload status:', upload.status, 'Asset ID:', upload.asset_id);

    if (upload.asset_id) {
      // Get asset information
      const asset = await mux.video.assets.retrieve(upload.asset_id);
      console.log('Asset status:', asset.status, 'Playback IDs:', asset.playback_ids);
      
      return res.json({
        status: asset.status,
        assetId: asset.id,
        playbackId: asset.playback_ids?.[0]?.id || null,
        thumbnail: asset.thumbnail || null,
        duration: asset.duration || null,
        file_size: asset.size || null,
      });
    }

    // Upload exists but no asset yet
    res.json({ 
      status: upload.status,
      assetId: null,
      playbackId: null,
      thumbnail: null,
      duration: null,
      file_size: null,
    });
  } catch (error) {
    console.error('Error checking Mux status:', error);
    console.error('Error details:', error.message);
    console.error('Available methods:', Object.getOwnPropertyNames(mux.video.uploads));
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Mux backend running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/api/health`);
});