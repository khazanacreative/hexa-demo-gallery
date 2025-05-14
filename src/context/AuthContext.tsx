
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserRole } from '@/types';

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
  
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem('hexa_current_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('hexa_current_user') !== null;
  });

  // Save users to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('hexa_users', JSON.stringify(users));
  }, [users]);
  
  // Save current user to localStorage whenever it changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('hexa_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('hexa_current_user');
    }
  }, [currentUser]);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simple authentication logic - in a real app, you would call an API
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
      // Create a copy of the user without the password for security
      const { password, ...userWithoutPassword } = user;
      setCurrentUser(user);
      setIsAuthenticated(true);
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('hexa_current_user');
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
    const newUser: AuthUser = {
      id: Date.now().toString(), // Simple ID generation for demo
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
