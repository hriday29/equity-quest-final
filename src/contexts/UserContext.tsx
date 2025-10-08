import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  team_code?: string;
}

interface UserRole {
  id: string;
  role: 'owner' | 'admin' | 'user';
}

interface UserContextType {
  user: User | null;
  profile: UserProfile | null;
  roles: UserRole[];
  isLoading: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  hasRole: (role: 'owner' | 'admin' | 'user') => boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

export { useUser };

interface UserProviderProps {
  children: React.ReactNode;
}

function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserData = async (userId: string) => {
    try {
      // Load profile and roles in parallel
      const [profileResult, rolesResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, email, team_code')
          .eq('id', userId)
          .single(),
        supabase
          .from('user_roles')
          .select('id, role')
          .eq('user_id', userId)
      ]);

      if (profileResult.data) {
        setProfile(profileResult.data);
      }

      if (rolesResult.data) {
        setRoles(rolesResult.data);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const refreshUser = async () => {
    if (user) {
      await loadUserData(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          setUser(session?.user ?? null);
          
          if (session?.user) {
            await loadUserData(session.user.id);
          }
          
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadUserData(session.user.id);
      } else {
        setProfile(null);
        setRoles([]);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Computed values
  const isOwner = roles.some(role => role.role === 'owner');
  const isAdmin = isOwner || roles.some(role => role.role === 'admin');
  
  const hasRole = (role: 'owner' | 'admin' | 'user') => {
    if (role === 'owner') {
      return isOwner;
    }
    if (role === 'admin') {
      return isAdmin;
    }
    return true; // All authenticated users have 'user' role
  };

  const value: UserContextType = {
    user,
    profile,
    roles,
    isLoading,
    isAdmin,
    isOwner,
    hasRole,
    refreshUser
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export { UserProvider };