
import { Project } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Edit, Trash2 } from 'lucide-react';
import { HexaButton } from './ui/hexa-button';
import { useState, useCallback } from 'react';
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
  
  // Instead of using useState and useEffect, directly compute the isAdmin value
  const isAdmin = currentUser?.role === 'admin';
  
  if (!isAdmin) return null;

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!currentUser || currentUser.role !== 'admin') {
      toast({
        title: "Authentication Required",
        description: "You must be logged in as admin to edit projects",
        variant: "destructive"
      });
      return;
    }
    
    if (onEdit) onEdit(project);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!currentUser || currentUser.role !== 'admin') {
      toast({
        title: "Authentication Required",
        description: "You must be logged in as admin to delete projects",
        variant: "destructive"
      });
      return;
    }
    
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
