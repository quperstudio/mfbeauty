import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '../types/database';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

// TIPOS Y CONTEXTO
// -----------------

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, role: string, businessName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// PROVEEDOR DE AUTENTICACIÓN
// ----------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  /** Carga los datos del perfil de usuario desde la tabla 'users' */
  const loadUserData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Perfil de usuario no encontrado.');

      setUser(data);
    } catch (error) {
      console.error('Fallo al cargar datos de usuario:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Efecto para manejar el estado de autenticación inicial y cambios
  useEffect(() => {
    // 1. Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (initialSession?.user) {
        loadUserData(initialSession.user.id);
      } else {
        setLoading(false);
      }
    });

    // 2. Suscribirse a cambios de estado
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        loadUserData(newSession.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);


  /** Iniciar sesión de usuario */
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (data.user) await loadUserData(data.user.id);

      return { error: null };
    } catch (error) {
      console.error('Fallo al iniciar sesión:', error);
      return { error: error as Error };
    }
  };

  /** Registrar nuevo usuario */
  const signUp = async (email: string, password: string, fullName: string, role: string, businessName?: string) => {
    try {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            business_name: businessName || 'Mi Negocio',
          },
        },
      });

      if (authError) throw authError;

      // La tabla 'users' y 'organizations' se llenan automáticamente con un trigger
      return { error: null };
    } catch (error) {
      console.error('Fallo al registrar usuario:', error);
      return { error: error as Error };
    }
  };

  /** Cerrar sesión */
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

// HOOK PERSONALIZADO
// ------------------
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
