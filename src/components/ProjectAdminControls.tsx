import { Project } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Edit, Trash2 } from 'lucide-react';
import { HexaButton } from './ui/hexa-button';
import { useState, useEffect } from 'react';
import { toast } from './ui/use-toast';
import { supabase, isUserAdmin } from '@/integrations/supabase/auth';

interface ProjectAdminControlsProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
}

const ProjectAdminControls = ({ 
  project, 
  onEdit, 
  onDelete
}: ProjectAdminControlsProps) => {
  const { currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Check admin status once when component mounts and when currentUser changes
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setLoading(true);
        
        // Special case for admin@example.com
        if (currentUser?.email === 'admin@example.com') {
          console.log('Admin email detected in component');
          setIsAdmin(true);
          setLoading(false);
          return;
        }
        
        // If currentUser has admin role from context
        if (currentUser?.role === 'admin') {
          console.log('User is admin via context');
          setIsAdmin(true);
          setLoading(false);
          return;
        }
        
        // Double-check with server as final verification
        const adminStatus = await isUserAdmin();
        console.log('Admin status from server check:', adminStatus);
        setIsAdmin(adminStatus);
        setLoading(false);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        setLoading(false);
      }
    };
    
    checkAdminStatus();
  }, [currentUser]);
  
  // Don't render anything if not admin or still loading
  if (loading || !isAdmin) return null;
  
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Edit clicked for project:', project.id);
    if (onEdit) onEdit(project);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Delete clicked for project:', project.id);
    if (onDelete) onDelete(project);
  };

  return (
    <div className="absolute top-2 right-2 z-30 flex gap-1">
      <HexaButton 
        variant="hexa" 
        size="sm"
        className="w-8 h-8 p-0 flex items-center justify-center rounded-full"
        onClick={handleEdit}
      >
        <Edit size={14} />
      </HexaButton>
      
      <HexaButton
        variant="destructive"
        size="sm"
        className="w-8 h-8 p-0 flex items-center justify-center rounded-full"
        onClick={handleDelete}
      >
        <Trash2 size={14} />
      </HexaButton>
    </div>
  );
};

export default ProjectAdminControls;
