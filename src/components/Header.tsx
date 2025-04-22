
import { useAuth } from '@/context/AuthContext';
import { HexaButton } from './ui/hexa-button';
import { LogOut, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { toast } from './ui/use-toast';

interface HeaderProps {
  onRoleToggle: () => void;
}

const Header = ({ onRoleToggle }: HeaderProps) => {
  const { currentUser, logout, isAuthenticated } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check admin status whenever authentication or user changes
    setIsAdmin(isAuthenticated && currentUser?.role === 'admin');
  }, [currentUser, isAuthenticated]);

  const handleLogout = async () => {
    try {
      await logout();
      // Force navigation to login page
      navigate('/login', { replace: true });
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account."
      });
    } catch (error) {
      console.error('Logout failed:', error);
      toast({
        title: "Logout failed",
        description: "There was a problem logging out.",
        variant: "destructive"
      });
    }
  };

  return (
    <header className="bg-gradient-to-r from-hexa-red to-hexa-dark-red text-white py-4 px-6 sm:px-10 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link to="/">
            <h1 className="text-2xl font-bold">Hexa Integra Mandiri</h1>
          </Link>
        </div>
                       
        <div className="flex items-center gap-3">
            
          {isAdmin && (
            <Link to="/users">
              <HexaButton 
                variant="ghost" 
                className="mr-2 flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10"
              >
                <Users size={16} />
                <span className="hidden sm:inline">Manage Users</span>
              </HexaButton>
            </Link>
          )}
          
          <HexaButton 
            variant="ghost" 
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 ml-2"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </HexaButton>
        </div>
      </div>
    </header>
  );
};

export default Header;
