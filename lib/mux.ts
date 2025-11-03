// All Mux management logic should be handled via /api endpoints.
// Do NOT import @mux/mux-node or use Node-specific libraries here!

// Client-side helper to build Mux playback URLs
export function getMuxPlaybackUrl(playbackId: string) {
  return playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : '';
}
