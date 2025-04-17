
import { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '@/types';
import { users } from '@/data/mockData';

interface AuthContextType {
  currentUser: User;
  setCurrentRole: (role: 'admin' | 'user') => void;
  toggleRole: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User>(users[0]); // Default to admin

  const setCurrentRole = (role: 'admin' | 'user') => {
    const user = users.find(u => u.role === role) || users[0];
    setCurrentUser(user);
  };

  const toggleRole = () => {
    const newRole = currentUser.role === 'admin' ? 'user' : 'admin';
    setCurrentRole(newRole);
  };

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentRole, toggleRole }}>
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
