import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { X, Mail, Lock, Eye, EyeOff, MessageCircle } from 'lucide-react-native';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AuthModal({ visible, onClose }: AuthModalProps) {
  const { signUp, signIn, signInWithGoogle, signInWithDiscord, resetPassword } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);

  async function handleAuth() {
    if (!email || (!password && !isResetPassword)) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (isResetPassword) {
        const { error } = await resetPassword(email);
        if (error) throw error;
        Alert.alert(
          'Password Reset',
          'Check your email for password reset instructions.',
          [{ text: 'OK', onPress: () => handleClose() }]
        );
        return;
      }

      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) throw error;
        Alert.alert(
          'Account Created',
          'Please check your email to confirm your account before signing in.',
          [{ text: 'OK', onPress: () => {
            setIsSignUp(false);
            setPassword('');
          }}]
        );
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        onClose();
        setEmail('');
        setPassword('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleSocialAuth(provider: 'google' | 'discord') {
    try {
      setLoading(true);
      setError(null);

      const { error } = provider === 'google' 
        ? await signInWithGoogle()
        : await signInWithDiscord();

      if (error) throw error;
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Social authentication failed');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setEmail('');
    setPassword('');
    setError(null);
    setIsSignUp(false);
    setIsResetPassword(false);
    setShowPassword(false);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {isResetPassword 
                ? 'Reset Password' 
                : isSignUp 
                ? 'Create Account' 
                : 'Sign In'}
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <X size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Mail size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
          </View>

          {!isResetPassword && (
            <View style={styles.inputContainer}>
              <Lock size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}>
                {showPassword ? (
                  <EyeOff size={20} color="#666" />
                ) : (
                  <Eye size={20} color="#666" />
                )}
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.buttonText}>
                {isResetPassword 
                  ? 'Send Reset Email' 
                  : isSignUp 
                  ? 'Sign Up' 
                  : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>

          {!isResetPassword && (
            <>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={[styles.socialButton, styles.googleButton]}
                onPress={() => handleSocialAuth('google')}
                disabled={loading}>
                <Text style={styles.socialButtonText}>Continue with Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialButton, styles.discordButton]}
                onPress={() => handleSocialAuth('discord')}
                disabled={loading}>
                <MessageCircle size={20} color="#fff" />
                <Text style={styles.socialButtonText}>Continue with Discord</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={styles.switchButtons}>
            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setIsResetPassword(false);
              }}
              disabled={loading}>
              <Text style={styles.switchButtonText}>
                {isSignUp
                  ? 'Already have an account? Sign In'
                  : "Don't have an account? Sign Up"}
              </Text>
            </TouchableOpacity>

            {!isSignUp && !isResetPassword && (
              <TouchableOpacity
                style={styles.switchButton}
                onPress={() => {
                  setIsResetPassword(true);
                  setError(null);
                }}
                disabled={loading}>
                <Text style={styles.switchButtonText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            {isResetPassword && (
              <TouchableOpacity
                style={styles.switchButton}
                onPress={() => {
                  setIsResetPassword(false);
                  setError(null);
                }}
                disabled={loading}>
                <Text style={styles.switchButtonText}>Back to Sign In</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  errorContainer: {
    backgroundColor: '#2a1a1a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 12,
  },
  eyeIcon: {
    padding: 4,
  },
  button: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    color: '#666',
    fontSize: 12,
    marginHorizontal: 16,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 14,
    marginBottom: 12,
    gap: 8,
  },
  googleButton: {
    backgroundColor: '#4285f4',
  },
  discordButton: {
    backgroundColor: '#5865F2',
  },
  socialButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButtons: {
    marginTop: 16,
  },
  switchButton: {
    alignItems: 'center',
    marginBottom: 8,
  },
  switchButtonText: {
    color: '#999',
    fontSize: 14,
  },
});
