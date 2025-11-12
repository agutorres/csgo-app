import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator, Image } from 'react-native';
import { Video as AVVideo } from 'expo-av';

interface MuxVideoPlayerProps {
  playbackId: string;
  posterUrl?: string;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  style?: any;
  fullscreen?: boolean;
}

export default function MuxVideoPlayer({
  playbackId,
  posterUrl,
  autoPlay = false,
  muted = true,
  controls = true,
  style,
  fullscreen = false,
}: MuxVideoPlayerProps) {
  const videoRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);

  if (!playbackId) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No video available</Text>
        </View>
      </View>
    );
  }

  const muxHlsUrl = `https://stream.mux.com/${playbackId}.m3u8`;

  // Web playback using hls.js
  useEffect(() => {
    if (Platform.OS === 'web' && videoRef.current) {
      import('hls.js').then((HlsModule) => {
        const Hls = HlsModule.default;
        const video = videoRef.current as HTMLVideoElement;

        if (Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(muxHlsUrl);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setLoading(false);
            if (autoPlay) video.play();
          });
        } else {
          // Safari supports HLS natively
          video.src = muxHlsUrl;
          video.onloadedmetadata = () => {
            setLoading(false);
            if (autoPlay) video.play();
          };
        }
      });
    }
  }, [playbackId]);

  // Mobile playback using expo-av
  useEffect(() => {
    if (Platform.OS !== 'web' && videoRef.current && autoPlay) {
      videoRef.current.playAsync().catch(() => {});
    }
  }, [autoPlay]);

  // For web, we need to flatten styles into a single object to avoid CSSStyleDeclaration indexed property error
  const webVideoStyle = Platform.OS === 'web' 
    ? (fullscreen 
        ? StyleSheet.flatten([styles.player, styles.webFullscreenPlayer])
        : StyleSheet.flatten(styles.player))
    : undefined;

  return (
    <View style={[fullscreen ? styles.fullscreenContainer : styles.container, style]}>
      {loading && posterUrl && (
        <Image source={{ uri: posterUrl }} style={styles.player} resizeMode="cover" />
      )}
      {loading && !posterUrl && (
        <View style={[styles.player, styles.loading]}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      {Platform.OS === 'web' ? (
        <video
          ref={videoRef}
          controls={controls}
          muted={muted}
          autoPlay={autoPlay}
          style={webVideoStyle}
          poster={posterUrl}
        />
      ) : (
        <AVVideo
          ref={videoRef}
          source={{ uri: muxHlsUrl }}
          useNativeControls={controls}
          shouldPlay={autoPlay}
          isMuted={muted}
          resizeMode={fullscreen ? "contain" : "cover"}
          style={[styles.player, fullscreen && styles.fullscreenPlayer]}
          onLoad={() => setLoading(false)}
          onError={(err) => console.error('Video playback error:', err)}
          onFullscreenUpdate={(status) => {
            console.log('Fullscreen status:', status);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  fullscreenContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  player: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  fullscreenPlayer: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  webFullscreenPlayer: {
    objectFit: 'contain',
  },
  loading: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
  },
});
