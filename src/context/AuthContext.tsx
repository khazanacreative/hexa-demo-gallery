import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { User, UserRole } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface AuthUser extends User {
  email: string;
  password?: string;
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
  logout: () => Promise<void>;
  toggleRole: () => void;
  addUser: (userData: UserCreationData) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
  checkAuthStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialUsers: AuthUser[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password',
    role: 'admin',
  },
  {
    id: '2',
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
  
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const checkAuthStatus = useCallback(async (): Promise<boolean> => {
    try {
      const localUser = localStorage.getItem('hexa_currentUser');
      if (localUser) {
        const parsedUser = JSON.parse(localUser);
        setCurrentUser(parsedUser);
        setIsAuthenticated(true);
        return true;
      }
      
      const { data } = await supabase.auth.getSession();
      
      if (data.session) {
        const userId = data.session.user.id;
        let user = users.find(u => u.id === userId);
        
        let userRole = "user";
        if (data.session.user && data.session.user.user_metadata && data.session.user.user_metadata.role) {
          userRole = data.session.user.user_metadata.role;
        } else if (
          data.session.user &&
          data.session.user.raw_user_meta_data &&
          data.session.user.raw_user_meta_data.role
        ) {
          userRole = data.session.user.raw_user_meta_data.role;
        }
        
        if (!user) {
          user = {
            id: userId,
            name: data.session.user.email?.split('@')[0] || 'User',
            email: data.session.user.email || '',
            role: userRole,
          };
          setUsers(prevUsers => [...prevUsers, user as AuthUser]);
        } else if (userRole && user.role !== userRole) {
          user = { ...user, role: userRole };
          setUsers(prevUsers => prevUsers.map(u => u.id === userId ? user as AuthUser : u));
        }
        
        setCurrentUser(user as AuthUser);
        setIsAuthenticated(true);
        localStorage.setItem('hexa_currentUser', JSON.stringify(user));
        return true;
      }
      
      setCurrentUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('hexa_currentUser');
      return false;
    } catch (error) {
      console.error('Error checking auth status:', error);
      setCurrentUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('hexa_currentUser');
      return false;
    }
  }, [users]);

  useEffect(() => {
    localStorage.setItem('hexa_users', JSON.stringify(users));
  }, [users]);
  
  useEffect(() => {
    checkAuthStatus();
    
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

    return () => {
      subscription.unsubscribe();
    };
  }, [checkAuthStatus]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log("Trying to login with:", email);
      
      const user = users.find(u => u.email === email && u.password === password);
      
      if (user) {
        console.log("Found local user:", user);
        setCurrentUser(user);
        setIsAuthenticated(true);
        localStorage.setItem('hexa_currentUser', JSON.stringify(user));
        
        toast({
          title: "Success",
          description: `Logged in as ${user.role.toUpperCase()}`,
        });
        
        return true;
      }
      
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
          const userId = data.user.id;
          let localUser = users.find(u => u.id === userId);
          
          if (!localUser) {
            localUser = {
              id: userId,
              name: data.user.email?.split('@')[0] || 'User',
              email: data.user.email || '',
              role: 'admin',
            };
            
            setUsers(prevUsers => [...prevUsers, localUser as AuthUser]);
          }
          
          setCurrentUser(localUser);
          setIsAuthenticated(true);
          localStorage.setItem('hexa_currentUser', JSON.stringify(localUser));
          
          toast({
            title: "Success",
            description: `Logged in as ${localUser.role.toUpperCase()}`,
          });
          
          return true;
        }
        
        return false;
      } catch (supabaseError) {
        console.error("Caught Supabase error:", supabaseError);
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
      setCurrentUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('hexa_currentUser');
      
      await supabase.auth.signOut();
      
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
      
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout Error",
        description: "Could not log out completely. Please try again.",
        variant: "destructive"
      });
      
      setCurrentUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('hexa_currentUser');
    }
  };

  const toggleRole = () => {
    if (!currentUser) return;
    
    const newRole: UserRole = currentUser.role === 'admin' ? 'user' : 'admin';
    const updatedUser = { ...currentUser, role: newRole };
    setCurrentUser(updatedUser);
    
    localStorage.setItem('hexa_currentUser', JSON.stringify(updatedUser));
    
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
        password: userData.password,
        role: userData.role,
      };
      
      setUsers(prevUsers => [...prevUsers, newUser]);
      
      toast({
        title: "User Added",
        description: `${userData.name} has been added successfully.`
      });
    } catch (error: any) {
      console.error('Error adding user:', error);
      
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
