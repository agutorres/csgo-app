import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#222128' },
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}
