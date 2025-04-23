
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { HexaButton } from '@/components/ui/hexa-button';
import { Project } from '@/types';
import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from './ui/use-toast';

interface DeleteConfirmationDialogProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmationDialog = ({
  project,
  isOpen,
  onClose,
  onConfirm,
}: DeleteConfirmationDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { currentUser } = useAuth();
  
  // Check admin status immediately when rendering
  const isAdmin = currentUser?.role === 'admin';
  
  // If not admin and dialog is open, close it
  if (isOpen && !isAdmin) {
    // Use a setTimeout to avoid React state update during render
    setTimeout(() => {
      toast({
        title: "Authentication Required",
        description: "Only admins can delete projects",
        variant: "destructive"
      });
      onClose();
    }, 0);
  }
  
  if (!project) return null;
  
  const handleConfirm = async () => {
    try {
      // Double-check authentication status
      if (!currentUser) {
        toast({
          title: "Authentication Required",
          description: "You must be logged in to delete projects",
          variant: "destructive"
        });
        onClose();
        return;
      }
      
      // Check admin role
      if (currentUser.role !== 'admin') {
        toast({
          title: "Permission Denied",
          description: "Only admins can delete projects",
          variant: "destructive"
        });
        onClose();
        return;
      }
      
      setIsDeleting(true);
      await onConfirm();
    } catch (error) {
      console.error("Error during delete confirmation:", error);
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-destructive">Delete Project</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{project.title}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-2 pt-4">
          <HexaButton 
            variant="outline" 
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </HexaButton>
          <HexaButton 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </HexaButton>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;
