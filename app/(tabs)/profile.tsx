import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { User, LogIn, LogOut, Settings, ArrowLeft, Languages } from 'lucide-react-native';
import AuthModal from '@/components/AuthModal';
import { router } from 'expo-router';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Language, languageNames, languageFlags } from '@/lib/i18n/translations';

export default function ProfileScreen() {
  const { user, signOut, isAdmin } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  async function handleSignOut() {
    await signOut();
  }

  async function handleLanguageChange(lang: Language) {
    await setLanguage(lang);
    setShowLanguageSelector(false);
  }

  const languages: Language[] = ['en', 'fr', 'es', 'ru', 'zh', 'de', 'pl', 'uk', 'it', 'pt'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('profile')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {user ? (
            <>
              <View style={styles.userInfo}>
                <View style={styles.iconContainer}>
                  <User size={64} color="#fff" strokeWidth={1.5} />
                </View>
                <Text style={styles.email}>{user.email}</Text>
                <Text style={styles.label}>{t('signedIn')}</Text>
              </View>

              {/* Language Selector */}
              <View style={styles.languageSection}>
                <TouchableOpacity
                  style={styles.languageButton}
                  onPress={() => setShowLanguageSelector(!showLanguageSelector)}
                >
                  <Languages size={20} color="#fff" />
                  <Text style={styles.languageButtonText}>
                    {t('language')}: {languageFlags[language]} <Text style={styles.languageCode}>{language.toUpperCase()}</Text> {languageNames[language]}
                  </Text>
                </TouchableOpacity>

                {showLanguageSelector && (
                  <View style={styles.languageSelector}>
                    {languages.map((lang) => (
                      <TouchableOpacity
                        key={lang}
                        style={[
                          styles.languageOption,
                          language === lang && styles.languageOptionActive,
                        ]}
                        onPress={() => handleLanguageChange(lang)}
                      >
                        <Text style={styles.languageOptionFlag}>{languageFlags[lang]}</Text>
                        <Text style={styles.languageCode}>{lang.toUpperCase()}</Text>
                        <Text
                          style={[
                            styles.languageOptionText,
                            language === lang && styles.languageOptionTextActive,
                          ]}
                        >
                          {languageNames[lang]}
                        </Text>
                        {language === lang && (
                          <View style={styles.languageOptionCheck}>
                            <Text style={styles.languageOptionCheckText}>✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {isAdmin && (
                <TouchableOpacity
                  style={[styles.button, styles.adminButton]}
                  onPress={() => router.push('/admin/maps')}
                >
                  <Settings size={20} color="#fff" />
                  <Text style={[styles.buttonText, styles.adminButtonText]}>{t('adminPanel')}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.button} onPress={handleSignOut}>
                <LogOut size={20} color="#000" />
                <Text style={styles.buttonText}>{t('signOut')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.userInfo}>
                <View style={styles.iconContainer}>
                  <User size={64} color="#666" strokeWidth={1.5} />
                </View>
                <Text style={styles.guestText}>{t('guestUser')}</Text>
                <Text style={styles.label}>{t('signInToComment')}</Text>
              </View>

              {/* Language Selector for guests */}
              <View style={styles.languageSection}>
                <TouchableOpacity
                  style={styles.languageButton}
                  onPress={() => setShowLanguageSelector(!showLanguageSelector)}
                >
                  <Languages size={20} color="#fff" />
                  <Text style={styles.languageButtonText}>
                    {t('language')}: {languageFlags[language]} <Text style={styles.languageCode}>{language.toUpperCase()}</Text> {languageNames[language]}
                  </Text>
                </TouchableOpacity>

                {showLanguageSelector && (
                  <View style={styles.languageSelector}>
                    {languages.map((lang) => (
                      <TouchableOpacity
                        key={lang}
                        style={[
                          styles.languageOption,
                          language === lang && styles.languageOptionActive,
                        ]}
                        onPress={() => handleLanguageChange(lang)}
                      >
                        <Text style={styles.languageOptionFlag}>{languageFlags[lang]}</Text>
                        <Text style={styles.languageCode}>{lang.toUpperCase()}</Text>
                        <Text
                          style={[
                            styles.languageOptionText,
                            language === lang && styles.languageOptionTextActive,
                          ]}
                        >
                          {languageNames[lang]}
                        </Text>
                        {language === lang && (
                          <View style={styles.languageOptionCheck}>
                            <Text style={styles.languageOptionCheckText}>✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.button}
                onPress={() => setShowAuthModal(true)}
              >
                <LogIn size={20} color="#000" />
                <Text style={styles.buttonText}>{t('signIn')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      <AuthModal visible={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222128',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1a1a20',
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
  languageSection: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 20,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a20',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: '#2a2a30',
  },
  languageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  languageSelector: {
    marginTop: 8,
    backgroundColor: '#1a1a20',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a2a30',
    overflow: 'hidden',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a30',
    gap: 12,
  },
  languageOptionActive: {
    backgroundColor: '#2a2a30',
  },
  languageOptionFlag: {
    fontSize: 24,
    width: 32,
  },
  languageCode: {
    color: '#facc15',
    fontSize: 14,
    fontWeight: '700',
    marginRight: 6,
    letterSpacing: 0.5,
  },
  languageOptionText: {
    color: '#ccc',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  languageOptionTextActive: {
    color: '#facc15',
    fontWeight: '600',
  },
  languageOptionCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#facc15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageOptionCheckText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
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
    width: '100%',
    maxWidth: 400,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  adminButton: {
    backgroundColor: '#222128',
    borderWidth: 1,
    borderColor: '#fff',
  },
  adminButtonText: {
    color: '#fff',
  },
});
