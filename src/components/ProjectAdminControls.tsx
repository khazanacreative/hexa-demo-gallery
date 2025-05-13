
import { Project } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Edit, Trash2 } from 'lucide-react';
import { HexaButton } from './ui/hexa-button';
import { useEffect, useState } from 'react';
import { supabase, checkProfileData } from '@/integrations/supabase/client';
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
  const { currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    // Verify admin status from the database and local state
    const verifyAdminStatus = async () => {
      if (!currentUser) {
        setIsAdmin(false);
        return;
      }
      
      console.log("Verifying admin status for:", currentUser.email);
      
      // Hardcoded admin check for admin@example.com
      if (currentUser.email === 'admin@example.com') {
        console.log("Admin email detected, granting admin privileges");
        setIsAdmin(true);
        return;
      }
      
      // Check from local state first for quick UI response
      if (currentUser.role === 'admin') {
        setIsAdmin(true);
      }
      
      // Double-check with database for confirmation
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentUser.id)
          .maybeSingle();
          
        if (error) {
          console.error('Error verifying admin status:', error);
          // If error with database, rely on local state only
        } else if (profile) {
          console.log("Profile role from database:", profile.role);
          setIsAdmin(profile.role === 'admin');
        } else {
          console.log("No profile found, relying on local state");
        }
      } catch (error) {
        console.error('Error in admin verification:', error);
      }
    };
    
    verifyAdminStatus();
  }, [currentUser]);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Admin edit clicked for project:", project.id);
    if (onEdit) {
      onEdit(project);
    }
  };
  
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Admin delete clicked for project:", project.id);
    if (onDelete) {
      toast({
        title: "Delete requested",
        description: `Attempting to delete project "${project.title}"`,
      });
      onDelete(project);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="absolute top-2 right-2 z-30 flex gap-1">
      <HexaButton 
        variant="hexa" 
        size="sm"
        className="w-8 h-8 p-0 flex items-center justify-center rounded-full"
        onClick={handleEditClick}
      >
        <Edit size={14} />
      </HexaButton>
      
      <HexaButton
        variant="destructive"
        size="sm"
        className="w-8 h-8 p-0 flex items-center justify-center rounded-full"
        onClick={handleDeleteClick}
      >
        <Trash2 size={14} />
      </HexaButton>
    </div>
  );
};

export default ProjectAdminControls;
