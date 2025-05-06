
import { Project } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Edit, Trash2 } from 'lucide-react';
import { HexaButton } from './ui/hexa-button';
import { useEffect, useState } from 'react';
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
          .single();
          
        if (error) {
          console.error('Error verifying admin status:', error);
          // If error with database, rely on local state only
        } else if (profile) {
          console.log("Profile role from database:", profile.role);
          setIsAdmin(profile.role === 'admin');
        }
      } catch (error) {
        console.error('Error in admin verification:', error);
      }
    };
    
    verifyAdminStatus();
  }, [currentUser]);

  if (!isAdmin) return null;

  return (
    <div className="absolute top-2 right-2 z-30 flex gap-1">
      <HexaButton 
        variant="hexa" 
        size="sm"
        className="w-8 h-8 p-0 flex items-center justify-center rounded-full"
        onClick={(e) => {
          e.stopPropagation();
          onEdit?.(project);
        }}
      >
        <Edit size={14} />
      </HexaButton>
      
      <HexaButton
        variant="destructive"
        size="sm"
        className="w-8 h-8 p-0 flex items-center justify-center rounded-full"
        onClick={(e) => {
          e.stopPropagation();
          onDelete?.(project);
        }}
      >
        <Trash2 size={14} />
      </HexaButton>
    </div>
  );
};

export default ProjectAdminControls;
