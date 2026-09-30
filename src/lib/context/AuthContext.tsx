'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('register');

  useEffect(() => {
    // 1. Get initial active session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      if (session?.user && typeof window !== 'undefined' && window.location.hash.includes('access_token=')) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    });

    // 2. Listen to Auth changes (login, logout, oauth callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      if (session?.user) {
        setIsAuthModalOpen(false);

        // Clean ugly hash from browser URL if redirecting from OAuth
        if (typeof window !== 'undefined' && window.location.hash.includes('access_token=')) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }

        // Auto-provision candidate user & profile
        try {
          await supabase.from('users').upsert({
            id: session.user.id,
            email: session.user.email,
            role: 'candidate',
            email_verified: true,
            is_active: true
          }, { onConflict: 'id' });

          const fullName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || '';
          const avatarUrl = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || '';

          if (fullName || avatarUrl) {
            await supabase.from('candidate_profiles').upsert({
              user_id: session.user.id,
              full_name: fullName,
              email: session.user.email,
              avatar_url: avatarUrl,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
          }
        } catch {
          // Silent fallback if tables not yet migrated
        }

        // Record login in background (if user_logins table exists)
        try {
          await supabase.from('user_logins').insert({
            user_id: session.user.id,
            email: session.user.email,
            provider: session.user.app_metadata?.provider || 'google',
            user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Web'
          });
        } catch {
          // Silent fallback if table not yet migrated
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const openAuthModal = (mode: 'login' | 'register' = 'register') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const signInWithGoogle = async () => {
    try {
      const redirectOrigin = typeof window !== 'undefined' ? window.location.origin : '';
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${redirectOrigin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          }
        }
      });
      if (error) throw error;
      if (data?.url && typeof window !== 'undefined') {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Error signing in with Google:', err.message);
      throw err;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      if (error) return { error };
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signUpWithEmail = async (email: string, password: string, fullName?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'candidate'
          }
        }
      });

      if (error) return { error };

      // Also upsert candidate user record
      if (data.user) {
        try {
          await supabase.from('users').upsert({
            id: data.user.id,
            email: data.user.email,
            role: 'candidate',
            email_verified: true,
            is_active: true
          });
        } catch (e) {
          // ignore
        }
      }

      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
