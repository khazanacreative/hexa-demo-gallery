
import { Project } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Edit, Trash2 } from 'lucide-react';
import { HexaButton } from './ui/hexa-button';
import { useEffect, useState } from 'react';
import { toast } from './ui/use-toast';

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
  const { currentUser, isAuthenticated, checkAuthStatus } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Check admin status when authentication or user changes
  useEffect(() => {
    const verifyAdminStatus = async () => {
      try {
        // First check current state
        if (currentUser && currentUser.role === 'admin') {
          setIsAdmin(true);
          return;
        }
        
        // If not admin or not authenticated, check auth status
        const isAuth = await checkAuthStatus();
        setIsAdmin(isAuth && currentUser?.role === 'admin');
      } catch (error) {
        console.error("Error verifying admin status:", error);
        setIsAdmin(false);
      }
    };
    
    verifyAdminStatus();
  }, [currentUser, isAuthenticated, checkAuthStatus]);

  if (!isAdmin) return null;

  const handleEdit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await checkAuthStatus(); // Re-check auth status before edit
      
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
      console.error("Error in edit handler:", error);
      toast({
        title: "Authentication Error",
        description: "Failed to verify your credentials. Please try logging in again.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await checkAuthStatus(); // Re-check auth status before delete
      
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
      console.error("Error in delete handler:", error);
      toast({
        title: "Authentication Error",
        description: "Failed to verify your credentials. Please try logging in again.",
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
