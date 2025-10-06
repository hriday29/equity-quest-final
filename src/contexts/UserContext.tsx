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

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: React.ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserData = async (userId: string) => {
    try {
      // Load profile and roles in parallel for better performance
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

      // Set profile data with fallbacks
      if (profileResult.data) {
        setProfile(profileResult.data);
      } else {
        console.error('Error loading profile:', profileResult.error);
        setProfile({
          id: userId,
          full_name: 'User',
          email: '',
        });
      }

      // Set roles data with fallbacks
      if (rolesResult.data && rolesResult.data.length > 0) {
        setRoles(rolesResult.data);
      } else {
        console.error('Error loading roles:', rolesResult.error);
        setRoles([{ id: userId, role: 'user' }]);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // Set default values to prevent infinite loading
      setProfile({
        id: userId,
        full_name: 'User',
        email: '',
      });
      setRoles([{ id: userId, role: 'user' }]);
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
        // Set a timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          if (mounted) {
            console.warn('Auth initialization timeout - setting loading to false');
            setIsLoading(false);
          }
        }, 5000); // 5 second timeout

        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            clearTimeout(timeoutId);
            setIsLoading(false);
          }
          return;
        }

        if (mounted) {
          setUser(session?.user ?? null);
          
          if (session?.user) {
            // Set loading to false immediately to show UI, then load data in background
            setIsLoading(false);
            await loadUserData(session.user.id);
          } else {
            clearTimeout(timeoutId);
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes - but only load data once per session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      // Only reload data on SIGNED_IN or SIGNED_OUT events
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        await loadUserData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setRoles([]);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Just update the user object, don't reload data
        setUser(session.user);
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
};
