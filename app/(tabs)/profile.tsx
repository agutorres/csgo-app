import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { User, LogIn, LogOut, Settings, ArrowLeft } from 'lucide-react-native';
import AuthModal from '@/components/AuthModal';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const { user, signOut, isAdmin } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  async function handleSignOut() {
    await signOut();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {user ? (
          <>
            <View style={styles.userInfo}>
              <View style={styles.iconContainer}>
                <User size={64} color="#fff" strokeWidth={1.5} />
              </View>
              <Text style={styles.email}>{user.email}</Text>
              <Text style={styles.label}>Signed in</Text>
            </View>

            {isAdmin && (
              <TouchableOpacity
                style={[styles.button, styles.adminButton]}
                onPress={() => router.push('/admin/maps')}>
                <Settings size={20} color="#fff" />
                <Text style={[styles.buttonText, styles.adminButtonText]}>Admin Panel</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.button} onPress={handleSignOut}>
              <LogOut size={20} color="#000" />
              <Text style={styles.buttonText}>Sign Out</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.userInfo}>
              <View style={styles.iconContainer}>
                <User size={64} color="#666" strokeWidth={1.5} />
              </View>
              <Text style={styles.guestText}>Guest User</Text>
              <Text style={styles.label}>Sign in to leave comments</Text>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={() => setShowAuthModal(true)}>
              <LogIn size={20} color="#000" />
              <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <AuthModal visible={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  email: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 8,
  },
  guestText: {
    fontSize: 18,
    color: '#999',
    fontWeight: '600',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 12,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  adminButton: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#fff',
  },
  adminButtonText: {
    color: '#fff',
  },
});
