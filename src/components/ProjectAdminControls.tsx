
import { Project } from '@/types';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/context/AuthContext';
import { Edit, Trash2, EyeOff } from 'lucide-react';
import { MorphButton } from './ui/morph-button';

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
  const isAdmin = currentUser.role === 'admin';

  if (!isAdmin) return null;

  return (
    <div className="absolute top-2 right-2 z-30 flex gap-1">
      <MorphButton 
        variant="morph" 
        size="sm"
        className="w-8 h-8 p-0 flex items-center justify-center rounded-full"
        onClick={(e) => {
          e.stopPropagation();
          onEdit?.(project);
        }}
      >
        <Edit size={14} />
      </MorphButton>
      
      <MorphButton
        variant="destructive"
        size="sm"
        className="w-8 h-8 p-0 flex items-center justify-center rounded-full"
        onClick={(e) => {
          e.stopPropagation();
          onDelete?.(project);
        }}
      >
        <Trash2 size={14} />
      </MorphButton>
    </div>
  );
};

export default ProjectAdminControls;
