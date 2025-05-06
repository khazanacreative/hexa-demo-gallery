
import { useState } from 'react';
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
  const { isAuthenticated } = useAuth();
  
  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setUploadProgress(0);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }
      
      if (!isAuthenticated) {
        throw new Error('You must be logged in to upload images.');
      }
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
      const filePath = `${folderPath}/${fileName}.${fileExt}`;
      
      console.log(`Uploading image to ${bucketName}/${filePath}`);
      
      // Use the enhanced uploadFile helper
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
      console.error('Error:', error);
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
    // If the current image is from Supabase storage, extract the path and delete it
    if (currentImageUrl && currentImageUrl.includes('project-images') && !currentImageUrl.startsWith('/')) {
      try {
        // Extract the path from the URL
        const urlParts = currentImageUrl.split('project-images/');
        if (urlParts.length > 1) {
          const path = urlParts[1];
          await deleteFile(bucketName, path);
          console.log("File deleted from storage:", path);
        }
      } catch (error) {
        console.error("Failed to delete file from storage:", error);
        // Continue with clearing the image URL even if deletion fails
      }
    }
    
    // Clear the image URL regardless of storage deletion success
    onImageUploaded({ path: '', url: '' });
  };
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-100 border">
        {currentImageUrl ? (
          <img 
            src={currentImageUrl} 
            alt="Preview" 
            className="w-full h-full object-cover"
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
          disabled={uploading || !isAuthenticated}
          title={!isAuthenticated ? "Login to upload images" : "Upload image"}
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
          disabled={uploading || !isAuthenticated}
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
