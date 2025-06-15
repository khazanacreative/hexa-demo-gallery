
import { Github, Globe, Heart } from 'lucide-react';
import { useProjects } from '@/context/ProjectContext';
import { useAuth } from '@/context/AuthContext';

const Footer = () => {
  const { projects } = useProjects();
  const { users } = useAuth();
  
  // Hitung jumlah kategori unik dari projects
  const uniqueCategories = [...new Set(projects.map(project => project.category))].filter(Boolean).length;
  
  // Hitung jumlah user roles unik
  const uniqueRoles = [...new Set(users.map(user => user.role))].length;
  
  return (
    <footer className="bg-gray-900 text-gray-300 py-8 px-4">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
          <div>
            <p className="font-semibold text-xl mb-1 bg-gradient-to-r from-morph-purple to-morph-blue bg-clip-text text-transparent">Morph Gallery</p>
            <p className="text-sm text-gray-400">A beautiful showcase for applications and websites</p>
          </div>
          
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-morph-purple transition-colors">
              <Github size={20} />
            </a>
            <a href="#" className="hover:text-morph-blue transition-colors">
              <Globe size={20} />
            </a>
            <a href="#" className="hover:text-morph-pink transition-colors">
              <Heart size={20} />
            </a>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-8 mb-4 md:mb-0">
            <div className="flex flex-col items-center">
              <span className="text-sm text-gray-400">Projects</span>
              <span className="font-semibold">{projects.length}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-sm text-gray-400">Categories</span>
              <span className="font-semibold">{uniqueCategories}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-sm text-gray-400">User Roles</span>
              <span className="font-semibold">{uniqueRoles}</span>
            </div>
          </div>
          
          <p className="text-sm text-gray-500">© 2024 Morph Gallery. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
