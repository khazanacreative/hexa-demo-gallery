
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Project } from "@/types";
import { Loader2 } from "lucide-react";
import { toast } from "./ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DeleteConfirmationDialogProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

const DeleteConfirmationDialog = ({
  project,
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false
}: DeleteConfirmationDialogProps) => {
  if (!project) return null;

  const handleConfirm = async () => {
    try {
      // Check auth status
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        toast({
          title: "Authentication required",
          description: "You must be logged in to delete projects",
          variant: "destructive"
        });
        return;
      }
      
      onConfirm();
    } catch (error) {
      console.error("[DeleteDialog] Error in confirmation handler:", error);
      toast({
        title: "Error",
        description: "Failed to delete the project. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Delete Project</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{project.title}</strong>? This action cannot be undone.
            {project.coverImage && project.coverImage.includes('project-images') && (
              <div className="mt-2">
                <p className="text-sm text-red-500">
                  Associated images will also be deleted from storage.
                </p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConfirmationDialog;
