
import React, { useCallback, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { checkStorageBucket, ensureProjectImagesBucket } from '@/integrations/supabase/storage';
import { isUserAdmin } from '@/integrations/supabase/auth';
import { cn } from '@/lib/utils';
import { HexaButton } from './ui/hexa-button';
import { Upload, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from './ui/use-toast';
import { FileUploadResult } from '@/types';

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
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(currentImageUrl);
  const [bucketExists, setBucketExists] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Check if the current image is a placeholder
  const isPlaceholder = currentImageUrl.includes('placeholder') || !currentImageUrl;

  // Check if bucket exists on component mount
  useEffect(() => {
    const checkBucket = async () => {
      try {
        console.log(`Checking if bucket '${bucketName}' exists...`);
        
        if (bucketName === 'project-images') {
          // Use the dedicated function for project-images bucket
          const exists = await ensureProjectImagesBucket();
          setBucketExists(exists);
          if (!exists) {
            setErrorMessage(`Storage bucket '${bucketName}' does not exist or could not be created`);
          } else {
            setErrorMessage(null);
          }
          return;
        }
        
        // For other buckets, use the general check
        const exists = await checkStorageBucket(bucketName);
        
        if (!exists) {
          console.error(`Bucket '${bucketName}' does not exist`);
          setErrorMessage(`Storage bucket '${bucketName}' does not exist`);
          setBucketExists(false);
        } else {
          console.log(`Bucket '${bucketName}' exists`);
          setBucketExists(true);
          setErrorMessage(null);
        }
      } catch (error) {
        console.error('Error in bucket check:', error);
        setBucketExists(false);
        setErrorMessage('Error checking storage bucket');
      }
    };
    
    checkBucket();
  }, [bucketName]);

  const uploadImage = useCallback(async (file: File) => {
    try {
      setUploading(true);

      if (!file) {
        throw new Error('You must select an image to upload');
      }
      
      // Get the current session to ensure authentication
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.log('No session found, attempting anonymous upload');
        toast({
          title: "Authentication Required",
          description: "You need to be logged in to upload files",
          variant: "destructive"
        });
        throw new Error('Authentication required for uploads');
      }
      
      console.log('User is authenticated:', sessionData.session.user.id);
      
      // Verify admin status for additional logging
      const isAdmin = await isUserAdmin();
      console.log('Is admin uploading?', isAdmin);
      
      // Create a unique file name to avoid collisions
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;
      
      console.log(`Uploading file to ${bucketName}/${filePath}`);
      
      // Upload the file to Supabase Storage
      const { data, error } = await supabase
        .storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Error uploading file:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Upload failed');
      }
      
      console.log('File uploaded successfully:', data);
      
      // Get the public URL
      const { data: publicUrlData } = supabase
        .storage
        .from(bucketName)
        .getPublicUrl(data.path);
        
      const url = publicUrlData.publicUrl;
      console.log('Public URL:', url);
      
      // Update the preview
      setPreviewUrl(url);
      
      // Call the callback with the result
      onImageUploaded({
        path: data.path,
        url
      });
      
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
      
      return url;
    } catch (error: any) {
      console.error('Error in uploadImage:', error);
      setErrorMessage(error.message);
      toast({
        title: "Error",
        description: `Upload failed: ${error.message}`,
        variant: "destructive"
      });
      throw error;
    } finally {
      setUploading(false);
    }
  }, [bucketName, folderPath, onImageUploaded]);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      try {
        const file = event.target.files?.[0];
        if (!file) return;

        // Check if bucket exists before attempting upload
        if (!bucketExists) {
          toast({
            title: "Error",
            description: "Storage bucket not configured. Contact administrator.",
            variant: "destructive"
          });
          return;
        }
        
        // Create a preview
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        
        // Upload the file
        await uploadImage(file);
        
        // Clean up the object URL
        URL.revokeObjectURL(objectUrl);
      } catch (error) {
        console.error('Error handling file:', error);
      }
    },
    [uploadImage, bucketExists]
  );

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div className={cn(
        "relative w-full bg-gray-100 rounded-md overflow-hidden border border-gray-200",
        compact ? "aspect-[4/3]" : "aspect-video"
      )}>
        {previewUrl && (
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-full object-cover"
            style={{ maxHeight: compact ? '120px' : '200px' }}
          />
        )}
        
        {!previewUrl && (
          <div className="flex items-center justify-center w-full h-full text-gray-400">
            No image
          </div>
        )}
        
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        )}
        
        {bucketExists === false && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
            <div className="text-white text-center p-4">
              <p className="mb-2">Storage bucket not configured</p>
              <p className="text-xs">{errorMessage || `Contact administrator to set up storage bucket: ${bucketName}`}</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex gap-1 w-full">
        <label className="w-full">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading || bucketExists === false}
            className="hidden"
          />
          <HexaButton
            type="button"
            variant={isPlaceholder ? "hexa" : "outline"}
            className="w-full"
            disabled={uploading || bucketExists === false}
            asChild
            size={compact ? "sm" : "default"}
          >
            <span>
              <Upload size={compact ? 14 : 16} className="mr-2" />
              {isPlaceholder ? "Upload" : "Change"}
            </span>
          </HexaButton>
        </label>
      </div>
    </div>
  );
};

export default ImageUploader;
