
import React, { useCallback, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { FileUploadResult } from '@/types';
import { useImageUpload } from '@/hooks/useImageUpload';
import ImagePreview from './ui/ImagePreview';
import UploadButton from './ui/UploadButton';
import { ensureProjectImagesBucket } from '@/integrations/supabase/storage';

interface ImageUploaderProps {
  currentImageUrl: string;
  onImageUploaded: (result: FileUploadResult) => void;
  bucketName: string;
  folderPath?: string;
  className?: string;
  compact?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  currentImageUrl,
  onImageUploaded,
  bucketName,
  folderPath = '',
  className,
  compact = false,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string>(currentImageUrl);
  
  // Check if the current image is a placeholder
  const isPlaceholder = currentImageUrl.includes('placeholder') || !currentImageUrl;

  // Use our custom hook for upload logic
  const { 
    uploadImage, 
    uploading, 
    errorMessage, 
    bucketExists,
    initialize
  } = useImageUpload({ bucketName, folderPath });

  // Check if bucket exists on component mount
  useEffect(() => {
    const checkBucket = async () => {
      try {
        console.log(`Checking if bucket '${bucketName}' exists...`);
        
        if (bucketName === 'project-images') {
          // Use the dedicated function for project-images bucket
          await ensureProjectImagesBucket();
        } else {
          // For other buckets, use the general initialize function
          await initialize();
        }
      } catch (error) {
        console.error('Error in bucket check:', error);
      }
    };
    
    checkBucket();
  }, [bucketName, initialize]);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      try {
        const file = event.target.files?.[0];
        if (!file) return;

        // Check if bucket exists before attempting upload
        if (!bucketExists) {
          return;
        }
        
        // Create a preview
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        
        // Upload the file
        const result = await uploadImage(file);
        
        // Clean up the object URL
        URL.revokeObjectURL(objectUrl);
        
        // If upload was successful, update with the result
        if (result) {
          setPreviewUrl(result.url);
          onImageUploaded(result);
        }
      } catch (error) {
        console.error('Error handling file:', error);
      }
    },
    [uploadImage, bucketExists, onImageUploaded]
  );

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <ImagePreview 
        previewUrl={previewUrl}
        uploading={uploading}
        bucketExists={bucketExists}
        errorMessage={errorMessage}
        bucketName={bucketName}
        compact={compact}
      />
      
      <div className="flex gap-1 w-full">
        <UploadButton 
          isPlaceholder={isPlaceholder}
          uploading={uploading}
          bucketExists={bucketExists}
          compact={compact}
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

export default ImageUploader;
