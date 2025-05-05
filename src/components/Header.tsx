
import { useAuth } from '@/context/AuthContext';
import { HexaButton } from './ui/hexa-button';
import { UserIcon, Menu, LogOut, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface HeaderProps {
  onRoleToggle: () => void;
}

const Header = ({ onRoleToggle }: HeaderProps) => {
  const { currentUser, logout } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Verify admin status from the database
    const verifyAdminStatus = async () => {
      if (currentUser) {
        console.log("Current user in Header:", currentUser);
        
        // Special case for admin@example.com
        if (currentUser.email === 'admin@example.com') {
          setIsAdmin(true);
          return;
        }
        
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', currentUser.id)
            .single();
            
          if (!error && profile) {
            setIsAdmin(profile.role === 'admin');
            console.log('User role from DB:', profile.role);
          } else {
            setIsAdmin(currentUser.role === 'admin');
            console.log('Using local role data:', currentUser.role);
          }
        } catch (error) {
          console.error('Error verifying admin status:', error);
          // Fall back to local state
          setIsAdmin(currentUser.role === 'admin');
        }
      } else {
        setIsAdmin(false);
      }
    };
    
    verifyAdminStatus();
  }, [currentUser]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-gradient-to-r from-hexa-red to-hexa-dark-red text-white py-4 px-6 sm:px-10 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link to="/">
            <h1 className="text-2xl font-bold">Galeri Hexa</h1>
          </Link>
        </div>
                       
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded">
            <UserIcon size={16} />
            <span className="font-medium">
              {currentUser?.name} ({isAdmin ? 'admin' : 'user'})
            </span>
          </div>
            
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
          
          <button className="md:hidden p-2 hover:bg-white/10 rounded transition-colors">
            <Menu size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
