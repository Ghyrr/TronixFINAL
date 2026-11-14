import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchAdminProfile } from '@/api/admin';
import { supabase } from '@/lib/supabase';
import type { Admin, PermissionKey } from '@/lib/types';

type AuthStatus = 'loading' | 'signed_out' | 'signed_in';

interface AuthContextValue {
  status: AuthStatus;
  admin: Admin | null;
  profileError: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  can: (permission: PermissionKey) => boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [profileError, setProfileError] = useState(false);

  const loadProfile = useCallback(async (userId: string | null) => {
    if (!userId) {
      setAdmin(null);
      setProfileError(false);
      setStatus('signed_out');
      return;
    }
    try {
      const profile = await fetchAdminProfile(userId);
      setAdmin(profile);
      setProfileError(false);
      setStatus('signed_in');
    } catch {
      setAdmin(null);
      setProfileError(true);
      setStatus('signed_in');
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      void loadProfile(data.session?.user.id ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (event === 'SIGNED_OUT' || !session) {
          await loadProfile(null);
          return;
        }
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          await loadProfile(session.user.id);
        }
      })();
    });

    return () => listener.subscription.unsubscribe();
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    await loadProfile(data.session?.user.id ?? null);
  }, [loadProfile]);

  const value = useMemo<AuthContextValue>(() => {
    const isActiveAdmin = Boolean(admin?.is_active);
    return {
      status,
      admin,
      profileError,
      signIn,
      signOut,
      refreshProfile,
      can: (permission) => {
        if (!isActiveAdmin || !admin) return false;
        return admin.role === 'super_admin' || admin.permissions[permission] === true;
      },
    };
  }, [status, admin, profileError, signIn, signOut, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
