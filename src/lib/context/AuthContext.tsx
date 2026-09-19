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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // 2. Listen to Auth changes (login, logout, oauth callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      if (session?.user) {
        setIsAuthModalOpen(false);
        // Record login in background (if user_logins table exists)
        try {
          await supabase.from('user_logins').insert({
            user_id: session.user.id,
            email: session.user.email,
            provider: session.user.app_metadata.provider || 'email',
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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${redirectOrigin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      if (error) throw error;
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
