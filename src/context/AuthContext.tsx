import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { supabase } from '@/integrations/supabase/client';

type CategoryPermission = 'web-app' | 'mobile-app' | 'website';

interface AuthUser extends User {
  email: string;
  password?: string;
  categoryPermissions?: CategoryPermission[];
}

interface UserCreationData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

interface AuthContextType {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  users: AuthUser[];
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  toggleRole: () => void;
  addUser: (userData: UserCreationData) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialUsers: AuthUser[] = [
  {
    id: 'c07e6ba2-a252-4f7c-a0f8-0ac7dbe433d5',
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password',
    role: 'admin',
  },
  {
    id: 'ef13c84c-195d-44ca-bf4a-8166500f1b3c',
    name: 'Test User',
    email: 'user@example.com',
    password: 'password',
    role: 'user',
  },
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<AuthUser[]>(() => {
    const savedUsers = localStorage.getItem('hexa_users');
    return savedUsers ? JSON.parse(savedUsers) : initialUsers;
  });
  
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const savedUser = localStorage.getItem('hexa_current_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('hexa_current_user') !== null;
  });

  // Save users to localStorage whenever users array changes
  useEffect(() => {
    localStorage.setItem('hexa_users', JSON.stringify(users));
  }, [users]);
  
  // Save current user to localStorage whenever currentUser changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('hexa_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('hexa_current_user');
    }
  }, [currentUser]);

  // Initialize Supabase auth listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session);
        if (session?.user) {
          // Convert Supabase user to our AuthUser format
          const authUser: AuthUser = {
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email || 'User',
            email: session.user.email || '',
            role: session.user.user_metadata?.role || 'user',
            categoryPermissions: session.user.user_metadata?.category_permissions || []
          };
          setCurrentUser(authUser);
          setIsAuthenticated(true);
        } else {
          // Only clear auth if we don't have a local user
          const localUser = localStorage.getItem('hexa_current_user');
          if (!localUser) {
            setCurrentUser(null);
            setIsAuthenticated(false);
          }
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const authUser: AuthUser = {
          id: session.user.id,
          name: session.user.user_metadata?.name || session.user.email || 'User',
          email: session.user.email || '',
          role: session.user.user_metadata?.role || 'user',
          categoryPermissions: session.user.user_metadata?.category_permissions || []
        };
        setCurrentUser(authUser);
        setIsAuthenticated(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('Attempting login for:', email);
    
    // First check local users (for demo purposes)
    const localUser = users.find(u => u.email === email && u.password === password);
    
    if (localUser) {
      console.log('Local user found:', localUser);
      setCurrentUser(localUser);
      setIsAuthenticated(true);
      return true;
    }

    // Try Supabase auth as fallback
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (data.user && !error) {
        console.log('Logged in with Supabase:', data.user);
        const authUser: AuthUser = {
          id: data.user.id,
          name: data.user.user_metadata?.name || data.user.email || 'User',
          email: data.user.email || '',
          role: data.user.user_metadata?.role || 'user',
          categoryPermissions: data.user.user_metadata?.category_permissions || []
        };
        setCurrentUser(authUser);
        setIsAuthenticated(true);
        return true;
      }
    } catch (error) {
      console.error('Supabase login error:', error);
    }
    
    console.log('Login failed for:', email);
    return false;
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('hexa_current_user');
  };

  const toggleRole = () => {
    if (!currentUser) return;
    
    const newRole: UserRole = currentUser.role === 'admin' ? 'user' : 'admin';
    const updatedUser = { ...currentUser, role: newRole };
    setCurrentUser(updatedUser);
    
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === currentUser.id ? updatedUser : user
      )
    );
  };

  const addUser = async (userData: UserCreationData): Promise<void> => {
    const newUser: AuthUser = {
      id: Date.now().toString(),
      ...userData
    };
    
    setUsers(prevUsers => [...prevUsers, newUser]);
  };

  const removeUser = async (userId: string): Promise<void> => {
    setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      isAuthenticated,
      users,
      login, 
      logout,
      toggleRole,
      addUser,
      removeUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
