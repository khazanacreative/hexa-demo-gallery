
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { supabase, checkProfileData } from '@/integrations/supabase/client';
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
  
  // Ensure admin user has admin role in the database
  const ensureAdminRole = async (userId: string, email: string) => {
    if (email !== 'admin@example.com') return;
    
    console.log('Ensuring admin role for:', email);
    
    // Check if profile exists and has admin role
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error checking admin profile:', error);
      
      // Create profile if it doesn't exist
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          name: 'Admin User',
          email: email,
          role: 'admin'
        });
        
      if (insertError) {
        console.error('Error creating admin profile:', insertError);
      } else {
        console.log('Created admin profile successfully');
      }
    } else if (profile && profile.role !== 'admin') {
      // Update role to admin if not already
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', userId);
        
      if (updateError) {
        console.error('Error updating to admin role:', updateError);
      } else {
        console.log('Updated to admin role successfully');
      }
    } else {
      console.log('Admin profile exists with correct role:', profile);
    }
    
    // Double-check profile after changes
    await checkProfileData(userId);
  };
  
  // Initialize auth state from Supabase
  useEffect(() => {
    console.log('Setting up auth listener...');
    
    // First set up the auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        
        if (session?.user) {
          const { id, email } = session.user;
          
          // Special handling for admin@example.com - set admin role immediately 
          let userRole: UserRole = email === 'admin@example.com' ? 'admin' : 'user';
          let userName = email === 'admin@example.com' ? 'Admin User' : (email?.split('@')[0] || 'User');
          
          // Create a user object from the session with initial role
          const userFromSession: AuthUser = {
            id,
            name: userName,
            email: email || '',
            role: userRole
          };
          
          // Set current user immediately with default values
          setCurrentUser(userFromSession);
          setIsAuthenticated(true);
          
          // If admin@example.com, ensure admin role in database
          if (email === 'admin@example.com') {
            // Use setTimeout to avoid Supabase auth recursion issues
            setTimeout(async () => {
              await ensureAdminRole(id, email);
            }, 0);
          }
          
          // Fetch profile data to get accurate role information
          setTimeout(async () => {
            try {
              const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single();
              
              if (!error && profile) {
                console.log('Profile found:', profile);
                
                // Update user with profile data
                setCurrentUser(prev => prev ? {
                  ...prev,
                  name: profile.name,
                  role: email === 'admin@example.com' ? 'admin' : (profile.role as UserRole)
                } : null);
                
                // Re-verify admin role for admin@example.com (belt and suspenders)
                if (email === 'admin@example.com' && profile.role !== 'admin') {
                  console.log('Admin user found but role is not admin, fixing...');
                  await ensureAdminRole(id, email);
                  
                  // Update UI with admin role regardless of database
                  setCurrentUser(prev => prev ? { ...prev, role: 'admin' } : null);
                }
              } else if (error) {
                console.error('Error fetching profile:', error);
                
                // Create profile if it doesn't exist
                if (error.code === 'PGRST116') {
                  console.log('Profile not found, creating...');
                  const { error: insertError } = await supabase
                    .from('profiles')
                    .insert({
                      id,
                      name: userName,
                      email: email || '',
                      role: userRole
                    });
                    
                  if (insertError) {
                    console.error('Error creating profile:', insertError);
                  }
                }
              }
            } catch (e) {
              console.error('Error in profile fetch:', e);
            }
          }, 0);
        } else {
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      }
    );
    
    // Then check for existing session
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Got existing session:', session?.user?.email);
      
      if (session?.user) {
        const { id, email } = session.user;
        
        // Special handling for admin@example.com - always set as admin
        let userRole: UserRole = email === 'admin@example.com' ? 'admin' : 'user';
        let userName = email === 'admin@example.com' ? 'Admin User' : (email?.split('@')[0] || 'User');
        
        // Create a user object from the session with initial values
        const userFromSession: AuthUser = {
          id,
          name: userName,
          email: email || '',
          role: userRole
        };
        
        // Set current user with initial values
        setCurrentUser(userFromSession);
        setIsAuthenticated(true);
        
        // If admin@example.com, ensure admin role in database
        if (email === 'admin@example.com') {
          await ensureAdminRole(id, email);
        }
        
        // Fetch actual profile data
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();
          
          if (!error && profile) {
            console.log('Profile found on init:', profile);
            
            // Update user with profile data
            setCurrentUser(prev => prev ? {
              ...prev,
              name: profile.name,
              role: email === 'admin@example.com' ? 'admin' : (profile.role as UserRole)
            } : null);
            
            // Re-verify admin role for admin@example.com
            if (email === 'admin@example.com' && profile.role !== 'admin') {
              console.log('Admin user found but role is not admin, fixing...');
              await ensureAdminRole(id, email);
              
              // Update UI with admin role regardless of database
              setCurrentUser(prev => prev ? { ...prev, role: 'admin' } : null);
            }
          } else if (error) {
            console.error('Error fetching profile on init:', error);
            
            // Create profile if it doesn't exist
            if (error.code === 'PGRST116') {
              console.log('Profile not found on init, creating...');
              const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                  id,
                  name: userName,
                  email: email || '',
                  role: userRole
                });
                
              if (insertError) {
                console.error('Error creating profile on init:', insertError);
              }
            }
          }
        } catch (e) {
          console.error('Error in profile fetch on init:', e);
        }
      }
    };
    
    initializeAuth();
    
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
        
        // Special handling for admin@example.com
        if (email === 'admin@example.com') {
          console.log('Admin user logged in, ensuring admin role privileges');
          
          // Force update current user to have admin role regardless of database
          setCurrentUser(prev => prev ? { ...prev, role: 'admin' } : null);
          
          setTimeout(async () => {
            // Ensure admin profile exists with admin role in database
            await ensureAdminRole(data.user.id, email);
            
            // Force create/update admin profile with admin role
            const { error } = await supabase
              .from('profiles')
              .upsert({
                id: data.user.id,
                name: 'Admin User',
                email: email,
                role: 'admin',
                updated_at: new Date().toISOString()
              });
              
            if (error) {
              console.error('Error updating admin profile:', error);
            } else {
              console.log('Admin profile updated successfully');
              
              // Double-check profile was updated correctly
              await checkProfileData(data.user.id);
            }
          }, 0);
        }
        
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        
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
