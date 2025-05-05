
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Session } from '@supabase/supabase-js';

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
  logout: () => void;
  toggleRole: () => void;
  addUser: (userData: UserCreationData) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
  session: Session | null;
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
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  // Save users to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('hexa_users', JSON.stringify(users));
  }, [users]);
  
  // Initialize auth state from Supabase
  useEffect(() => {
    console.log('Setting up auth listener...');
    // First set up the auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        
        if (session?.user) {
          const { id, email } = session.user;
          // Create a user object from the session
          const userFromSession: AuthUser = {
            id,
            name: email?.split('@')[0] || 'User',
            email: email || '',
            role: email === 'admin@example.com' ? 'admin' : 'user' // Set admin role for admin@example.com
          };
          
          setCurrentUser(userFromSession);
          setIsAuthenticated(true);
          
          // Fetch user profile data
          supabase.from('profiles')
            .select('*')
            .eq('id', id)
            .single()
            .then(({ data, error }) => {
              if (!error && data) {
                console.log('Profile found:', data);
                setCurrentUser(prev => prev ? {
                  ...prev,
                  name: data.name,
                  role: data.role as UserRole
                } : null);
              } else if (error) {
                console.error('Error fetching profile:', error);
              }
            });
        } else {
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      }
    );
    
    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Got existing session:', session?.user?.email);
      setSession(session);
      
      if (session?.user) {
        const { id, email } = session.user;
        // Create a user object from the session
        const userFromSession: AuthUser = {
          id,
          name: email?.split('@')[0] || 'User',
          email: email || '',
          role: email === 'admin@example.com' ? 'admin' : 'user' // Set admin role for admin@example.com
        };
        
        setCurrentUser(userFromSession);
        setIsAuthenticated(true);
        
        // Fetch additional user data
        supabase.from('profiles')
          .select('*')
          .eq('id', id)
          .single()
          .then(({ data, error }) => {
            if (!error && data) {
              console.log('Profile found on init:', data);
              setCurrentUser(prev => prev ? {
                ...prev,
                name: data.name,
                role: data.role as UserRole
              } : null);
            } else if (error) {
              console.error('Error fetching profile on init:', error);
            }
          });
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting login with:', email);
      // Try Supabase auth first
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Supabase auth error:', error);
        
        // Fall back to mock auth for demo
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
          console.log('Mock auth successful for:', email);
          // Create a copy of the user without the password for security
          const { password, ...userWithoutPassword } = user;
          setCurrentUser(user);
          setIsAuthenticated(true);
          toast({
            title: "Demo login",
            description: "Using mock auth as fallback",
          });
          return true;
        }
        
        toast({
          title: "Login error",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }
      
      if (data.session) {
        console.log('Supabase login successful for:', email);
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });

        // Add special handling for admin@example.com
        if (email === 'admin@example.com') {
          console.log('Admin user detected, setting admin role');
          const { id } = data.user;
          
          // Check if admin profile exists in database
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();
            
          if (profileError || !profileData) {
            // If no profile exists, create one with admin role
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: id,
                name: 'Admin User',
                email: email,
                role: 'admin'
              });
              
            if (insertError) {
              console.error('Error creating admin profile:', insertError);
            } else {
              console.log('Created admin profile');
            }
          } else if (profileData.role !== 'admin') {
            // Update role to admin if it's not already
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ role: 'admin' })
              .eq('id', id);
              
            if (updateError) {
              console.error('Error updating admin role:', updateError);
            } else {
              console.log('Updated user to admin role');
            }
          }
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    }
  };

  const logout = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Also clear local state
      setCurrentUser(null);
      setIsAuthenticated(false);
      setSession(null);
      localStorage.removeItem('hexa_current_user');
      
      toast({
        title: "Logout successful",
        description: "You have been logged out",
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout error",
        description: "Failed to sign out",
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
    
    // If we have a real user in Supabase, update their profile as well
    if (session?.user) {
      supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', currentUser.id)
        .then(({ error }) => {
          if (error) {
            console.error('Error updating role in Supabase:', error);
          } else {
            console.log('Updated role in Supabase to:', newRole);
          }
        });
    }
  };

  const addUser = async (userData: UserCreationData): Promise<void> => {
    try {
      // First try to create user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            role: userData.role
          }
        }
      });
      
      if (error) {
        console.error('Supabase signup error:', error);
        throw error;
      }
      
      // For demo, also add to local state
      const newUser: AuthUser = {
        id: data.user?.id || Date.now().toString(), // Use Supabase ID or fallback
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role
      };
      
      setUsers(prevUsers => [...prevUsers, newUser]);
      toast({
        title: "User added",
        description: `${userData.name} has been added successfully`,
      });
    } catch (error: any) {
      console.error('Error adding user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add user",
        variant: "destructive"
      });
      throw error;
    }
  };

  const removeUser = async (userId: string): Promise<void> => {
    // Note: In a real app, you would call supabase.auth.admin.deleteUser()
    // but this requires an admin key which shouldn't be in the frontend
    
    // For demo, just remove from local state
    setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    toast({
      title: "User removed",
      description: "User has been removed successfully",
    });
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
      session
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
