import { useAuth as useAuthContext } from '@/lib/AuthContext';

export function useAuth() {
  return useAuthContext();
}

export function useRequireAuth() {
  const { user, loading } = useAuth();
  
  if (!loading && !user) {
    throw new Error('Authentication required');
  }
  
  return { user, loading };
}
