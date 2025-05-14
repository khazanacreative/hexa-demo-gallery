
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { HexaButton } from '@/components/ui/hexa-button';
import { Project } from '@/types';

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
  if (!project) return null;

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
          <HexaButton variant="outline" onClick={onClose}>
            Cancel
          </HexaButton>
          <HexaButton 
            variant="destructive" 
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Delete
          </HexaButton>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;
