# Mux + Supabase Integration Setup Guide

This guide will help you set up Mux video uploads and Supabase database integration for your CS:GO app.

## 1. Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Mux Configuration
EXPO_PUBLIC_MUX_TOKEN_ID=your_mux_token_id
EXPO_PUBLIC_MUX_TOKEN_SECRET=your_mux_token_secret
EXPO_PUBLIC_MUX_ENVIRONMENT_ID=your_mux_environment_id
```

### Getting Your Credentials:

#### Supabase:
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the Project URL and anon public key

#### Mux:
1. Go to your Mux dashboard
2. Navigate to Settings > API Access Tokens
3. Create a new access token with the following permissions:
   - Video: Read, Write
   - Upload: Read, Write
4. Copy the Token ID and Token Secret
5. For Environment ID, use your Mux environment ID (usually found in your dashboard)

## 2. Database Migration

Run the database migration to add Mux support:

```bash
# If using Supabase CLI
supabase db push

# Or run the migration manually in your Supabase SQL editor
# Copy the contents of supabase/migrations/20251021020000_add_mux_support.sql
```

## 3. Mux Webhook Setup (Optional but Recommended)

To automatically update video status when Mux processing is complete:

1. Go to your Mux dashboard
2. Navigate to Settings > Webhooks
3. Create a new webhook with these settings:
   - URL: `https://your-domain.com/api/mux-webhook` (you'll need to deploy this)
   - Events: Select `video.asset.ready`, `video.asset.errored`, `video.upload.cancelled`

## 4. Testing the Integration

### Upload a Video:
1. Start your app: `npm run dev`
2. Go to the Admin tab > Videos
3. Click "Upload Video" to create a Mux upload
4. Use the provided upload URL to upload your video file
5. The video will be processed by Mux and automatically updated in your database

### View Videos:
1. Go to any map page
2. Click on a video to view it
3. The video will play using the Mux player if it's ready

## 5. File Structure

The integration adds these new files:

```
lib/
├── mux.ts                 # Mux client configuration
├── videoService.ts        # Video management service
└── muxWebhooks.ts         # Webhook handlers

components/
├── VideoUpload.tsx        # Video upload component
└── MuxVideoPlayer.tsx    # Mux video player component

supabase/migrations/
└── 20251021020000_add_mux_support.sql  # Database schema updates
```

## 6. Key Features

### Video Upload:
- Creates Mux upload URLs for direct file uploads
- Tracks upload progress and status
- Automatically updates database when processing completes

### Video Playback:
- Uses Mux's optimized video player
- Supports adaptive bitrate streaming
- Automatic thumbnail generation
- Mobile-optimized controls

### Database Integration:
- Stores Mux asset IDs and playback IDs
- Tracks video processing status
- Maintains video metadata (duration, file size, etc.)

## 7. Troubleshooting

### Common Issues:

1. **"Mux upload failed"**: Check your Mux credentials and permissions
2. **"Video not ready"**: Wait for Mux processing to complete (usually 1-2 minutes)
3. **"No video available"**: Ensure the video has a valid Mux playback ID

### Debug Steps:

1. Check browser console for error messages
2. Verify environment variables are set correctly
3. Check Mux dashboard for upload/processing status
4. Verify Supabase database has the correct schema

## 8. Production Considerations

### Security:
- Never expose Mux secret keys in client-side code
- Use server-side API routes for sensitive operations
- Implement proper authentication for admin functions

### Performance:
- Enable Mux's CDN for faster video delivery
- Use appropriate video quality settings
- Implement proper error handling and retry logic

### Monitoring:
- Set up Mux webhooks for production monitoring
- Monitor video processing times and error rates
- Track user engagement with video content

## 9. Next Steps

1. Set up your environment variables
2. Run the database migration
3. Test video upload and playback
4. Configure Mux webhooks for production
5. Deploy your app with the new video features

For more information, refer to:
- [Mux Documentation](https://docs.mux.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Expo Router Documentation](https://expo.github.io/router/)
