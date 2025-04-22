
import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { User, UserRole } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

// Extended user interface with email and password
interface AuthUser extends User {
  email: string;
  password?: string;
}

// New user creation interface
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
  logout: () => Promise<void>;
  toggleRole: () => void;
  addUser: (userData: UserCreationData) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
  checkAuthStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initial admin and user accounts
const initialUsers: AuthUser[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password', // In a real app, this would be hashed
    role: 'admin',
  },
  {
    id: '2',
    name: 'Test User',
    email: 'user@example.com',
    password: 'password', // In a real app, this would be hashed
    role: 'user',
  },
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<AuthUser[]>(() => {
    // Try to load users from localStorage on initial load
    const savedUsers = localStorage.getItem('hexa_users');
    return savedUsers ? JSON.parse(savedUsers) : initialUsers;
  });
  
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Check authentication status on mount
  const checkAuthStatus = useCallback(async (): Promise<boolean> => {
    try {
      // Check if user is authenticated with Supabase
      const { data } = await supabase.auth.getSession();
      
      if (data.session) {
        // Find the corresponding user in our local database
        const userId = data.session.user.id;
        const user = users.find(u => u.id === userId) || {
          id: userId,
          name: data.session.user.email || 'User',
          email: data.session.user.email || '',
          role: 'user',
        };
        
        setCurrentUser(user);
        setIsAuthenticated(true);
        return true;
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
        return false;
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      return false;
    }
  }, [users]);

  // Save users to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('hexa_users', JSON.stringify(users));
  }, [users]);
  
  // Check auth status on initial load
  useEffect(() => {
    checkAuthStatus();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await checkAuthStatus();
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    });

    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [checkAuthStatus]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Try to authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      if (data.user) {
        // Find the corresponding user in our local database
        const userId = data.user.id;
        let user = users.find(u => u.id === userId);
        
        // If user doesn't exist locally, create one
        if (!user) {
          user = {
            id: userId,
            name: data.user.email || 'User',
            email: data.user.email || '',
            role: 'user', // Default role
          };
          
          setUsers(prevUsers => [...prevUsers, user as AuthUser]);
        }
        
        setCurrentUser(user);
        setIsAuthenticated(true);
        return true;
      }
      
      // Fallback to local auth if Supabase fails
      const user = users.find(u => u.email === email && u.password === password);
      
      if (user) {
        // Create a copy of the user without the password for security
        const { password: _, ...userWithoutPassword } = user;
        setCurrentUser(user);
        setIsAuthenticated(true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Error",
        description: "Could not log in. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout Error",
        description: "Could not log out. Please try again.",
        variant: "destructive"
      });
    }
  };

  const toggleRole = () => {
    if (!currentUser) return;
    
    // This is for demo purposes only - in a real app you wouldn't do this
    const newRole: UserRole = currentUser.role === 'admin' ? 'user' : 'admin';
    const updatedUser = { ...currentUser, role: newRole };
    setCurrentUser(updatedUser);
    
    // Also update the user in the users array
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === currentUser.id ? updatedUser : user
      )
    );
  };

  const addUser = async (userData: UserCreationData): Promise<void> => {
    try {
      // Create user in Supabase
      const { data, error } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
      });
      
      if (error) throw error;
      
      const newUser: AuthUser = {
        id: data.user?.id || Date.now().toString(), // Use Supabase ID if available
        name: userData.name,
        email: userData.email,
        password: userData.password, // In a real app, this would be hashed
        role: userData.role,
      };
      
      setUsers(prevUsers => [...prevUsers, newUser]);
    } catch (error) {
      console.error('Error adding user:', error);
      // Fallback to local user creation
      const newUser: AuthUser = {
        id: Date.now().toString(),
        ...userData
      };
      
      setUsers(prevUsers => [...prevUsers, newUser]);
    }
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
      removeUser,
      checkAuthStatus,
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
