import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Platform,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";

const BACKEND_API_URL =
  Platform.OS === "web"
    ? "https://fps-guide-api.vercel.app"
    : "https://fps-guide-api.vercel.app";

export default function VideoUpload({
  mapId,
  title = "New Video",
  positionName = "Unknown Position",
  difficulty = "easy",
  categorySectionId,
  side,
  videoType,
  onUploadComplete,
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");

  const handleVideoUpload = async () => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadStatus("Selecting video...");

      const result = await DocumentPicker.getDocumentAsync({
        type: "video/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setIsUploading(false);
        return;
      }

      const videoFile = result.assets[0];

      setUploadStatus("Creating Mux upload...");
      const uploadRes = await fetch(`${BACKEND_API_URL}/api/mux/upload`, {
        method: "POST",
      });
      if (!uploadRes.ok) throw new Error("Failed to create Mux upload");

      const data = await uploadRes.json();
      const upload = data?.upload;
      if (!upload?.url) throw new Error("Mux upload response invalid");

      setUploadProgress(15);
      setUploadStatus("Creating video record...");

      const { data: video, error: videoError } = await supabase
        .from("videos")
        .insert({
          map_id: mapId,
          category_section_id: categorySectionId,
          side,
          video_type: videoType,
          title: title || videoFile.name,
          difficulty,
          position_name: positionName,
          mux_upload_id: upload.id,
          mux_status: "pending",
        })
        .select()
        .single();

      if (videoError) throw new Error(videoError.message);

      setUploadStatus("Uploading video to Mux...");
      setUploadProgress(30);

      const blob = await (await fetch(videoFile.uri)).blob();
      const uploadToMux = await fetch(upload.url, {
        method: "PUT",
        headers: { "Content-Type": videoFile.mimeType || "video/mp4" },
        body: blob,
      });
      if (!uploadToMux.ok) throw new Error("Failed to upload to Mux");

      await supabase
        .from("videos")
        .update({ mux_status: "processing" })
        .eq("id", video.id);

      setUploadStatus("Processing on Mux...");
      setUploadProgress(80);

      const interval = setInterval(async () => {
        try {
          const res = await fetch(`${BACKEND_API_URL}/api/mux/status/${upload.id}`);
          const status = await res.json();

          if (status.playbackId) {
            clearInterval(interval);
            await supabase
              .from("videos")
              .update({
                mux_asset_id: status.assetId,
                mux_playback_id: status.playbackId,
                mux_status: "ready",
                video_url: `https://stream.mux.com/${status.playbackId}.m3u8`,
                thumbnail_url: status.thumbnail,
                duration_seconds: status.duration
                  ? Math.round(status.duration)
                  : null,
                file_size_bytes: status.file_size || null,
              })
              .eq("id", video.id);

            setUploadProgress(100);
            setUploadStatus("Complete!");

            Alert.alert(
              "✅ Upload Complete",
              "Your video has been successfully uploaded and processed!",
              [
                {
                  text: "OK",
                  onPress: () => {
                    setIsUploading(false);
                    setUploadProgress(0);
                    setUploadStatus("");
                    onUploadComplete?.(video.id);
                    router.push("/admin/videos");
                  },
                },
              ]
            );
          }
        } catch (err) {
          console.error("Mux status error:", err);
        }
      }, 4000);
    } catch (err) {
      console.error("Video upload error:", err);
      Alert.alert("Upload Error", err.message || "Unknown error");
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, isUploading && styles.disabled]}
        onPress={handleVideoUpload}
        disabled={isUploading}
      >
        <Text style={styles.text}>
          {isUploading ? "Uploading..." : "Upload Video"}
        </Text>
      </TouchableOpacity>

      {isUploading && (
        <View style={styles.progress}>
          <Text style={styles.status}>{uploadStatus}</Text>
          <View style={styles.bar}>
            <View style={[styles.fill, { width: `${uploadProgress}%` }]} />
          </View>
          <Text style={styles.percent}>{uploadProgress}%</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  disabled: { backgroundColor: "#aaa" },
  text: { color: "#fff", fontSize: 16, fontWeight: "600" },
  progress: { marginTop: 16, alignItems: "center" },
  status: { color: "#666", marginBottom: 8 },
  bar: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e5e5e5",
    overflow: "hidden",
  },
  fill: { height: "100%", backgroundColor: "#007AFF" },
  percent: { color: "#666", marginTop: 4 },
});
