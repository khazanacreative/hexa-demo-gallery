
import { useState, useEffect } from 'react';
import { FileUploadResult } from '@/types';
import { HexaButton } from './ui/hexa-button';
import { Image, Loader2, X } from 'lucide-react';
import { toast } from './ui/use-toast';
import { supabase, uploadFile, deleteFile } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface ImageUploaderProps {
  currentImageUrl: string;
  onImageUploaded: (result: FileUploadResult) => void;
  bucketName?: string;
  folderPath?: string;
  className?: string;
}

const ImageUploader = ({ 
  currentImageUrl, 
  onImageUploaded, 
  bucketName = 'project-images', 
  folderPath = 'covers',
  className = '', 
}: ImageUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { isAuthenticated, currentUser } = useAuth();
  
  // Check auth status on load
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        console.log('[ImageUploader] User is authenticated:', data.session.user.id);
      } else {
        console.log('[ImageUploader] User is not authenticated');
      }
    };
    
    checkAuth();
  }, []);
  
  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setUploadProgress(0);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }
      
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "You must be logged in to upload images.",
          variant: "destructive"
        });
        throw new Error('You must be logged in to upload images.');
      }
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
      const filePath = `${folderPath}/${fileName}.${fileExt}`;
      
      console.log(`[ImageUploader] Uploading image to ${bucketName}/${filePath} as user ${session.user.id}`);
      console.log(`[ImageUploader] User role: ${currentUser?.role}`);
      
      // Use the uploadFile helper with progress callback
      const result = await uploadFile(
        bucketName, 
        filePath, 
        file, 
        (progress) => setUploadProgress(progress)
      );

      if (!result) {
        throw new Error('Upload failed - no result returned');
      }

      onImageUploaded({
        path: result.path,
        url: result.url
      });

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });

    } catch (error: any) {
      console.error('[ImageUploader] Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleDeleteCurrentImage = async () => {
    try {
      // If the current image is from Supabase storage
      if (currentImageUrl && currentImageUrl.includes('project-images')) {
        // Get the current session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast({
            title: "Authentication required",
            description: "You must be logged in to delete images.",
            variant: "destructive"
          });
          return;
        }
        
        // Check if user is admin
        const isAdmin = currentUser?.role === 'admin';
        console.log('[ImageUploader] User deleting image, admin status:', isAdmin);
        
        // Extract the path from the URL
        const urlParts = currentImageUrl.split('.co/storage/v1/object/public/project-images/');
        if (urlParts.length > 1) {
          const path = urlParts[1];
          console.log(`[ImageUploader] Attempting to delete file from ${bucketName}/${path}`);
          
          const deleted = await deleteFile(bucketName, path);
          if (deleted) {
            console.log("[ImageUploader] File deleted from storage:", path);
            toast({
              title: "Success",
              description: "Image deleted successfully",
            });
          } else {
            console.error("[ImageUploader] Failed to delete from storage:", path);
          }
        } else {
          console.error("[ImageUploader] Could not parse image path from URL:", currentImageUrl);
        }
      }
      
      // Clear the image URL regardless of storage deletion success
      onImageUploaded({ path: '', url: '' });
    } catch (error) {
      console.error("[ImageUploader] Error in handleDeleteCurrentImage:", error);
      toast({
        title: "Deletion failed",
        description: "Failed to delete the image",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-100 border">
        {currentImageUrl ? (
          <img 
            src={currentImageUrl} 
            alt="Preview" 
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error('[ImageUploader] Image failed to load:', currentImageUrl);
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
            <Image size={16} />
          </div>
        )}
      </div>
      
      <input
        type="text"
        className="flex-1 px-3 py-2 border border-gray-200 rounded"
        placeholder="Image URL or upload"
        value={currentImageUrl}
        onChange={(e) => onImageUploaded({ path: '', url: e.target.value })}
      />
      
      <div className="relative">
        <HexaButton 
          type="button" 
          variant="outline" 
          size="icon" 
          className="flex-shrink-0"
          disabled={uploading}
          title="Upload image"
        >
          {uploading ? (
            <div className="relative">
              <Loader2 size={16} className="animate-spin" />
              {uploadProgress > 0 && (
                <span className="absolute -bottom-5 -left-2 text-xs w-10 text-center">
                  {uploadProgress}%
                </span>
              )}
            </div>
          ) : (
            <Image size={16} />
          )}
        </HexaButton>
        <input 
          type="file"
          accept="image/*"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={uploadImage}
          disabled={uploading}
        />
      </div>
      
      {currentImageUrl && (
        <HexaButton
          type="button"
          variant="outline"
          size="icon"
          className="flex-shrink-0"
          onClick={handleDeleteCurrentImage}
        >
          <X size={16} />
        </HexaButton>
      )}
    </div>
  );
};

export default ImageUploader;
