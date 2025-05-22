
import { useState } from 'react';
import { FileUploadResult } from '@/types';
import { HexaButton } from './ui/hexa-button';
import { Image, Loader2, X, AlertCircle } from 'lucide-react';
import { toast } from './ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ImageUploaderProps {
  currentImageUrl: string;
  onImageUploaded: (result: FileUploadResult) => void;
  bucketName?: string;
  folderPath?: string;
  className?: string;
  maxSizeInMB?: number;
}

const ImageUploader = ({ 
  currentImageUrl, 
  onImageUploaded, 
  bucketName = 'project-images', 
  folderPath = 'covers',
  className = '',
  maxSizeInMB = 5,
}: ImageUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const validateFile = (file: File): boolean => {
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setError(`Invalid file type. Allowed types: ${validTypes.join(', ')}`);
      return false;
    }
    
    // Check file size (in bytes)
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      setError(`File size exceeds the maximum limit of ${maxSizeInMB}MB`);
      return false;
    }
    
    setError(null);
    return true;
  };
  
  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null);
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }
      
      const file = event.target.files[0];
      
      // Validate file before upload
      if (!validateFile(file)) {
        return;
      }
      
      // Create a unique file name to prevent collisions
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const filePath = `${folderPath}/${timestamp}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.error('Error uploading:', error.message);
        throw error;
      }

      if (!data) {
        throw new Error('Upload failed - no data returned');
      }

      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);

      onImageUploaded({
        path: data.path,
        url: urlData.publicUrl
      });

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });

    } catch (error: any) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to upload image";
      setError(errorMessage);
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  // Function to check if the URL is a Supabase storage URL
  const isStorageUrl = (url: string): boolean => {
    return url.includes(bucketName) || url.includes('supabase');
  };
  
  // Function to handle direct URL input
  const handleUrlChange = (url: string) => {
    setError(null);
    onImageUploaded({ path: '', url });
  };
  
  // Function to handle URL removal
  const handleClearImage = () => {
    setError(null);
    onImageUploaded({ path: '', url: '' });
  };
  
  return (
    <div className="space-y-2 w-full">
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-100 border">
          {currentImageUrl ? (
            <img 
              src={currentImageUrl} 
              alt="Preview" 
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder.svg';
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
          onChange={(e) => handleUrlChange(e.target.value)}
        />
        
        <div className="relative">
          <HexaButton 
            type="button" 
            variant="outline" 
            size="icon" 
            className="flex-shrink-0"
            disabled={uploading}
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Image size={16} />}
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
            onClick={handleClearImage}
          >
            <X size={16} />
          </HexaButton>
        )}
      </div>
      
      {error && (
        <div className="text-red-500 text-xs flex items-center gap-1">
          <AlertCircle size={12} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
