// AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/database';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, contactNumber: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Session check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    setUser(data.user);
  };

  const register = async (name: string, email: string, password: string, contactNumber: string) => {
    // 1. Sign up with Supabase Auth and store metadata
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          phone_number: contactNumber,
        }
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    if (data.user) {
      // 2. Update user metadata to ensure phone_number is saved
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: name,
          phone_number: contactNumber,
        }
      });

      if (updateError) {
        console.error('Failed to update user metadata:', updateError);
        throw new Error('Registration successful but failed to save phone number');
      }

      // 3. Also save to user_credentials table for backup
      const { error: insertError } = await supabase
        .from('user_credentials')
        .insert({
          user_id: data.user.id,
          full_name: name,
          contact_number: contactNumber,
        });

      if (insertError) {
        console.error('Failed to save user credentials:', insertError);
        // Don't throw here - auth metadata was saved successfully
      }

      setUser(data.user);
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};