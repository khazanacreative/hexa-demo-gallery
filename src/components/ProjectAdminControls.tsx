
import { Project } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Edit, Trash2, Shield } from 'lucide-react';
import { HexaButton } from './ui/hexa-button';
import { toast } from './ui/use-toast';
import { useState } from 'react';

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
  const isAdmin = currentUser?.role === 'admin';
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isAdmin) return null;

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isProcessing) return;
    
    try {
      onEdit?.(project);
    } catch (error) {
      console.error('Edit error:', error);
      toast({
        title: "Error",
        description: "Failed to edit project. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      onDelete?.(project);
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="absolute top-2 right-2 z-30 flex gap-1">
      <div className="absolute -top-8 right-0 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
        <Shield size={12} />
        <span>Admin</span>
      </div>
      
      <HexaButton 
        variant="hexa" 
        size="sm"
        className="w-8 h-8 p-0 flex items-center justify-center rounded-full"
        onClick={handleEdit}
        disabled={isProcessing}
      >
        <Edit size={14} />
      </HexaButton>
      
      <HexaButton
        variant="destructive"
        size="sm"
        className="w-8 h-8 p-0 flex items-center justify-center rounded-full"
        onClick={handleDelete}
        disabled={isProcessing}
      >
        <Trash2 size={14} />
      </HexaButton>
    </div>
  );
};

export default ProjectAdminControls;
