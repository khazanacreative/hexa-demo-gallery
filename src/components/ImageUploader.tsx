
import React, { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { HexaButton } from './ui/hexa-button';
import { Upload, Loader2, RefreshCw } from 'lucide-react';
import { toast } from './ui/use-toast';
import { FileUploadResult } from '@/types';

interface ImageUploaderProps {
  currentImageUrl: string;
  onImageUploaded: (result: FileUploadResult) => void;
  bucketName: string;
  folderPath?: string;
  className?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  currentImageUrl,
  onImageUploaded,
  bucketName,
  folderPath = '',
  className,
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(currentImageUrl);
  
  // Check if the current image is a placeholder
  const isPlaceholder = currentImageUrl.includes('placeholder') || !currentImageUrl;

  const uploadImage = useCallback(async (file: File) => {
    try {
      setUploading(true);
      
      // Check authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      if (!file) {
        throw new Error('You must select an image to upload');
      }
      
      // Create a unique file name to avoid collisions
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;
      
      // Check if bucket exists
      const { data: bucketData, error: bucketError } = await supabase
        .storage
        .getBucket(bucketName);
        
      if (bucketError && bucketError.message.includes('The resource was not found')) {
        console.error('Bucket not found:', bucketName);
        throw new Error(`Storage bucket "${bucketName}" not found. Please create it first.`);
      }

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
      toast({
        title: "Error",
        description: `Upload failed: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  }, [bucketName, folderPath, onImageUploaded]);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        // Create a preview
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        
        // Upload the file
        await uploadImage(file);
        
        // Clean up the object URL
        URL.revokeObjectURL(objectUrl);
      }
    },
    [uploadImage]
  );

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative w-full aspect-video bg-gray-100 rounded-md overflow-hidden border border-gray-200">
        {previewUrl && (
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-full object-cover"
            style={{ maxHeight: '200px' }}
          />
        )}
        
        {!previewUrl && (
          <div className="flex items-center justify-center w-full h-full text-gray-400">
            No image selected
          </div>
        )}
        
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            {uploading ? (
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            ) : (
              <RefreshCw className="h-8 w-8 text-white" />
            )}
          </div>
        )}
      </div>
      
      <div className="flex gap-2 w-full">
        <label className="w-full">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
          <HexaButton
            type="button"
            variant={isPlaceholder ? "hexa" : "outline"}
            className="w-full"
            disabled={uploading}
            asChild
          >
            <span>
              <Upload size={16} className="mr-2" />
              {isPlaceholder ? "Upload Image" : "Change Image"}
            </span>
          </HexaButton>
        </label>
      </div>
    </div>
  );
};

export default ImageUploader;
