import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async (sbUser) => {
    if (!sbUser) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', sbUser.id)
        .single();
      
      setUser({
        user_id: sbUser.id,
        email: sbUser.email,
        name: profile?.name || sbUser.user_metadata?.name || '',
        phone: profile?.phone || '',
        state: profile?.state || '',
        country: profile?.country || 'Nigeria',
        role: profile?.role || 'user',
        wishlist: profile?.wishlist || [],
        created_at: profile?.created_at || sbUser.created_at,
      });
    } catch (e) {
      setUser({
        user_id: sbUser.id,
        email: sbUser.email,
        name: sbUser.user_metadata?.name || '',
        phone: '',
        state: '',
        country: 'Nigeria',
        role: 'user',
        wishlist: [],
        created_at: sbUser.created_at,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchUserProfile(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    } catch {
      setUser(null);
      setLoading(false);
    }
  }, [fetchUserProfile]);

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchUserProfile(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkAuth, fetchUserProfile]);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await fetchUserProfile(data.user);
    return data;
  };

  const register = async (formData) => {
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          name: formData.name,
        }
      }
    });
    if (error) throw error;

    const sbUser = data.user;
    const profileDoc = {
      user_id: sbUser.id,
      name: formData.name,
      phone: formData.phone || '',
      state: formData.state || '',
      country: formData.country || 'Nigeria',
      role: 'user',
      wishlist: [],
    };
    
    const { error: profileError } = await supabase.from('profiles').insert(profileDoc);
    if (profileError) {
      console.error("Failed to insert profile:", profileError);
    } else {
      // Send welcome email
      fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'welcome',
          to: formData.email,
          data: { name: formData.name }
        })
      }).catch(err => console.error("Failed to trigger welcome email:", err));
    }

    await fetchUserProfile(sbUser);
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'staff';

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, isAdmin, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
