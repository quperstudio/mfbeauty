import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '../types/database';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, role: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        loadUserData(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error loading user data from database:', error);
        throw error;
      }

      if (!data) {
        console.error('User exists in auth but not in users table. User ID:', userId);
        throw new Error('User profile not found. Please contact support.');
      }

      setUser(data);
    } catch (error) {
      console.error('Failed to load user data:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting to sign in with email:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Authentication error:', error);
        throw error;
      }

      console.log('Authentication successful for user:', data.user?.id);

      if (data.user) {
        await loadUserData(data.user.id);
      }

      console.log('Sign in completed successfully');
      return { error: null };
    } catch (error) {
      console.error('Sign in failed:', error);
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: string) => {
    try {
      console.log('Attempting to sign up with email:', email);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) {
        console.error('Sign up authentication error:', authError);
        throw authError;
      }

      console.log('User created in auth.users:', authData.user?.id);

      if (authData.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        if (userError) {
          console.error('Error checking user table:', userError);
        }

        if (!userData) {
          console.log('User not found in users table, trigger should have created it');
        } else {
          console.log('User successfully created in users table:', userData);
        }
      }

      console.log('Sign up completed successfully');
      return { error: null };
    } catch (error) {
      console.error('Sign up failed:', error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
