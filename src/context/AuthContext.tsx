
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
      // First check local storage - fastest way
      const localUser = localStorage.getItem('hexa_currentUser');
      if (localUser) {
        const parsedUser = JSON.parse(localUser);
        setCurrentUser(parsedUser);
        setIsAuthenticated(true);
        return true;
      }
      
      // Then check Supabase session
      const { data } = await supabase.auth.getSession();
      
      if (data.session) {
        // Find the corresponding user in our local database
        const userId = data.session.user.id;
        
        // Try to find in existing users first
        let user = users.find(u => u.id === userId);
        
        // If not found, create a default user object
        if (!user) {
          user = {
            id: userId,
            name: data.session.user.email?.split('@')[0] || 'User',
            email: data.session.user.email || '',
            role: 'user', // Default role
          };
          
          // Add to users list
          setUsers(prevUsers => [...prevUsers, user as AuthUser]);
        }
        
        // Update current user and authentication status
        setCurrentUser(user);
        setIsAuthenticated(true);
        
        // Save to localStorage for faster access next time
        localStorage.setItem('hexa_currentUser', JSON.stringify(user));
        
        return true;
      }
      
      // If no session found
      setCurrentUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('hexa_currentUser');
      return false;
      
    } catch (error) {
      console.error('Error checking auth status:', error);
      // Clear everything to be safe
      setCurrentUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('hexa_currentUser');
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
      console.log('Auth state changed:', event, session);
      if (event === 'SIGNED_IN' && session) {
        await checkAuthStatus();
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('hexa_currentUser');
      }
    });

    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [checkAuthStatus]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log("Trying to login with:", email);
      
      // First try the local database
      const user = users.find(u => u.email === email && u.password === password);
      
      if (user) {
        console.log("Found local user:", user);
        setCurrentUser(user);
        setIsAuthenticated(true);
        // Save to localStorage for persistence
        localStorage.setItem('hexa_currentUser', JSON.stringify(user));
        return true;
      }
      
      // If not found locally, try with Supabase
      try {
        console.log("Trying Supabase login");
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) {
          console.error("Supabase login error:", error);
          throw error;
        }
        
        if (data.user) {
          console.log("Supabase login success:", data);
          // Find the corresponding user in our local database
          const userId = data.user.id;
          let localUser = users.find(u => u.id === userId);
          
          // If user doesn't exist locally, create one
          if (!localUser) {
            localUser = {
              id: userId,
              name: data.user.email?.split('@')[0] || 'User',
              email: data.user.email || '',
              role: 'admin', // Default to admin for demo purposes
            };
            
            setUsers(prevUsers => [...prevUsers, localUser as AuthUser]);
          }
          
          setCurrentUser(localUser);
          setIsAuthenticated(true);
          localStorage.setItem('hexa_currentUser', JSON.stringify(localUser));
          return true;
        }
        
        return false;
      } catch (supabaseError) {
        console.error("Caught Supabase error:", supabaseError);
        // Continue to return false as the login failed
        return false;
      }
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
      // First clear local state
      setCurrentUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('hexa_currentUser');
      
      // Then try to sign out from Supabase
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout Error",
        description: "Could not log out completely. Please try again.",
        variant: "destructive"
      });
      
      // Still clear local state even if Supabase logout fails
      setCurrentUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('hexa_currentUser');
    }
  };

  const toggleRole = () => {
    if (!currentUser) return;
    
    // This is for demo purposes only - in a real app you wouldn't do this
    const newRole: UserRole = currentUser.role === 'admin' ? 'user' : 'admin';
    const updatedUser = { ...currentUser, role: newRole };
    setCurrentUser(updatedUser);
    
    // Update localStorage
    localStorage.setItem('hexa_currentUser', JSON.stringify(updatedUser));
    
    // Also update the user in the users array
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === currentUser.id ? updatedUser : user
      )
    );
    
    toast({
      title: "Role Updated",
      description: `Your role has been changed to ${newRole.toUpperCase()}`
    });
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
        id: data.user?.id || crypto.randomUUID(),
        name: userData.name,
        email: userData.email,
        password: userData.password, // In a real app, this would be hashed
        role: userData.role,
      };
      
      setUsers(prevUsers => [...prevUsers, newUser]);
      
      toast({
        title: "User Added",
        description: `${userData.name} has been added successfully.`
      });
    } catch (error: any) {
      console.error('Error adding user:', error);
      
      // Fallback to local user creation
      const newUser: AuthUser = {
        id: crypto.randomUUID(),
        ...userData
      };
      
      setUsers(prevUsers => [...prevUsers, newUser]);
      
      toast({
        title: "User Added Locally",
        description: `${userData.name} has been added to local storage.`
      });
    }
  };

  const removeUser = async (userId: string): Promise<void> => {
    try {
      // Don't allow removing the currently logged in user
      if (currentUser?.id === userId) {
        throw new Error("Cannot remove currently logged in user");
      }
      
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      
      toast({
        title: "User Removed",
        description: "User has been removed successfully."
      });
    } catch (error: any) {
      console.error('Error removing user:', error);
      toast({
        title: "Error",
        description: error.message || "Could not remove user.",
        variant: "destructive"
      });
      throw error;
    }
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
