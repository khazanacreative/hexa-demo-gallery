
import { Project } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Edit, Trash2 } from 'lucide-react';
import { HexaButton } from './ui/hexa-button';
import { useEffect, useState } from 'react';
import { toast } from './ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  const { currentUser, checkAuthStatus } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    const verifyAdminStatus = async () => {
      await checkAuthStatus();
      // Check if user is admin after authentication status is verified
      setIsAdmin(currentUser?.role === 'admin');
    };
    
    verifyAdminStatus();
  }, [currentUser, checkAuthStatus]);
  
  if (!isAdmin) return null;

  const handleEdit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      // Double check current session
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        toast({
          title: "Authentication Required",
          description: "You must be logged in as admin to edit projects",
          variant: "destructive"
        });
        return;
      }
      
      if (!currentUser || currentUser.role !== 'admin') {
        toast({
          title: "Authentication Required",
          description: "You must be logged in as admin to edit projects",
          variant: "destructive"
        });
        return;
      }
      
      if (onEdit) onEdit(project);
    } catch (error) {
      console.error("Error checking authentication:", error);
      toast({
        title: "Error",
        description: "Failed to verify permissions. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      // Double check current session
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        toast({
          title: "Authentication Required",
          description: "You must be logged in as admin to delete projects",
          variant: "destructive"
        });
        return;
      }
      
      if (!currentUser || currentUser.role !== 'admin') {
        toast({
          title: "Authentication Required",
          description: "You must be logged in as admin to delete projects",
          variant: "destructive"
        });
        return;
      }
      
      if (onDelete) onDelete(project);
    } catch (error) {
      console.error("Error checking authentication:", error);
      toast({
        title: "Error",
        description: "Failed to verify permissions. Please try again.",
        variant: "destructive"
      });
    }
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
