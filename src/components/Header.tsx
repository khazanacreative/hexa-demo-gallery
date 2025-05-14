
import { useAuth } from '@/context/AuthContext';
import { HexaButton } from './ui/hexa-button';
import { UserIcon, Menu, Search, LogOut, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface HeaderProps {
  onRoleToggle: () => void;
}

const Header = ({ onRoleToggle }: HeaderProps) => {
  const { currentUser, logout } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
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
          
          {/* Tombol Admin/User Mode dihapus */}

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
