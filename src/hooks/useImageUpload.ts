
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { checkStorageBucket } from '@/integrations/supabase/storage';
import { isUserAdmin } from '@/integrations/supabase/auth';
import { FileUploadResult } from '@/types';
import { toast } from '@/components/ui/use-toast';

interface UseImageUploadOptions {
  bucketName: string;
  folderPath?: string;
}

export const useImageUpload = ({ bucketName, folderPath = '' }: UseImageUploadOptions) => {
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bucketExists, setBucketExists] = useState<boolean | null>(null);

  // Check if bucket exists
  const checkBucket = useCallback(async () => {
    try {
      console.log(`Checking if bucket '${bucketName}' exists...`);
      
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
      
      return exists;
    } catch (error) {
      console.error('Error in bucket check:', error);
      setBucketExists(false);
      setErrorMessage('Error checking storage bucket');
      return false;
    }
  }, [bucketName]);

  // Upload image function
  const uploadImage = useCallback(async (file: File): Promise<FileUploadResult | null> => {
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
      
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
      
      return {
        path: data.path,
        url
      };
    } catch (error: any) {
      console.error('Error in uploadImage:', error);
      setErrorMessage(error.message);
      toast({
        title: "Error",
        description: `Upload failed: ${error.message}`,
        variant: "destructive"
      });
      return null;
    } finally {
      setUploading(false);
    }
  }, [bucketName, folderPath]);

  // Initialize by checking bucket
  const initialize = useCallback(async () => {
    return await checkBucket();
  }, [checkBucket]);

  return {
    uploadImage,
    uploading,
    errorMessage,
    bucketExists,
    initialize
  };
};
