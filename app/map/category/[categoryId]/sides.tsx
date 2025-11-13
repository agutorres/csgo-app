import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { ChevronLeft } from 'lucide-react-native';
import { Image } from 'react-native';

type Category = Database['public']['Tables']['categories']['Row'];

export default function SideSelectionScreen() {
  const { categoryId, mapId } = useLocalSearchParams<{ categoryId: string; mapId: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (categoryId) {
      fetchCategory();
    }
  }, [categoryId]);

  async function fetchCategory() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single();

      if (error) throw error;
      setCategory(data);
    } catch (err) {
      console.error('Error fetching category:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleSideSelect(side: 'T' | 'CT') {
    router.push({
      pathname: '/map/category/[categoryId]/sections',
      params: { categoryId, mapId, side },
    });
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{category?.name}</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>Select Side</Text>
        
        <View style={styles.sideContainer}>
          <TouchableOpacity
            style={styles.sideButton}
            onPress={() => handleSideSelect('T')}
          >
            <View style={styles.sideButtonContent}>
              <Image
                source={require('@/assets/images/t.png')}
                style={styles.sideIcon}
                resizeMode="contain"
              />
              <Text style={styles.sideText}>T Side</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sideButton}
            onPress={() => handleSideSelect('CT')}
          >
            <View style={styles.sideButtonContent}>
              <Image
                source={require('@/assets/images/ct.png')}
                style={styles.sideIcon}
                resizeMode="contain"
              />
              <Text style={styles.sideText}>CT Side</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222128',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222128',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 32,
    textAlign: 'center',
  },
  sideContainer: {
    gap: 20,
  },
  sideButton: {
    backgroundColor: '#1a1a20',
    borderRadius: 12,
    padding: 24,
    borderWidth: 2,
    borderColor: '#2a2a30',
  },
  sideButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  sideIcon: {
    width: 40,
    height: 40,
  },
  sideText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
});

