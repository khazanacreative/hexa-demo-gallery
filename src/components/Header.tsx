
import { useAuth } from '@/context/AuthContext';
import { HexaButton } from './ui/hexa-button';
import { UserIcon, Lock, Menu, Search, Bell } from 'lucide-react';

interface HeaderProps {
  onRoleToggle: () => void;
}

const Header = ({ onRoleToggle }: HeaderProps) => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser.role === 'admin';

  return (
    <header className="bg-gradient-to-r from-hexa-red to-hexa-dark-red text-white py-4 px-6 sm:px-10 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">HEXA Demo Gallery</h1>
          <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Showcase</span>
        </div>
        
        <div className="hidden md:flex items-center gap-6">
          <nav>
            <ul className="flex items-center gap-6">
              <li><a href="#" className="hover:text-white/80 transition-colors">Browse</a></li>
              <li><a href="#" className="hover:text-white/80 transition-colors">Categories</a></li>
              {isAdmin && (
                <li><a href="#" className="hover:text-white/80 transition-colors">Dashboard</a></li>
              )}
            </ul>
          </nav>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 mr-2">
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <Search size={18} />
            </button>
            
            {isAdmin && (
              <button className="p-2 hover:bg-white/10 rounded-full transition-colors relative">
                <Bell size={18} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full"></span>
              </button>
            )}
          </div>
          
          <HexaButton 
            variant="ghost" 
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10"
            onClick={onRoleToggle}
          >
            {isAdmin ? (
              <>
                <Lock size={16} />
                <span className="hidden sm:inline">Admin Mode</span>
              </>
            ) : (
              <>
                <UserIcon size={16} />
                <span className="hidden sm:inline">User Mode</span>
              </>
            )}
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
