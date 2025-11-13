import { Tabs } from 'expo-router';
import { Map, Video, MessageSquare, FolderOpen, Layers, Image as ImageIcon } from 'lucide-react-native';

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#222128',
          borderTopColor: '#333',
        },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#666',
      }}>
      <Tabs.Screen
        name="maps"
        options={{
          title: 'Maps',
          tabBarIcon: ({ size, color }) => <Map size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarIcon: ({ size, color }) => <FolderOpen size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="video-categories"
        options={{
          title: 'Video Cats',
          tabBarIcon: ({ size, color }) => <Layers size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="videos"
        options={{
          title: 'Videos',
          tabBarIcon: ({ size, color }) => <Video size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="callouts"
        options={{
          title: 'Callouts',
          tabBarIcon: ({ size, color }) => <ImageIcon size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="comments"
        options={{
          title: 'Comments',
          tabBarIcon: ({ size, color }) => <MessageSquare size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
