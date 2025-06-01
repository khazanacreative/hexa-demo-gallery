
import { useState, useEffect } from 'react';
import { FileUploadResult } from '@/types';
import { HexaButton } from './ui/hexa-button';
import { Image, Loader2, X, AlertCircle } from 'lucide-react';
import { toast } from './ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

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
  const [previewUrl, setPreviewUrl] = useState<string>(currentImageUrl);
  const { currentUser } = useAuth();
  
  useEffect(() => {
    setPreviewUrl(currentImageUrl);
  }, [currentImageUrl]);
  
  const validateFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setError(`Invalid file type. Allowed types: JPEG, PNG, GIF, WEBP, SVG`);
      return false;
    }
    
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

      console.log('Starting image upload, current user:', currentUser);
      
      const file = event.target.files[0];
      console.log('File selected:', file.name, file.size, file.type);
      
      if (!validateFile(file)) {
        setUploading(false);
        return;
      }
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      const filePath = `${folderPath}/${fileName}.${fileExt}`;
      
      console.log(`Uploading image to: ${bucketName}/${filePath}`);
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.error('Storage error details:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Upload failed - no data returned');
      }

      console.log('Upload successful:', data);

      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);
      
      console.log('Public URL:', urlData);

      setPreviewUrl(urlData.publicUrl);
      onImageUploaded({
        path: data.path,
        url: urlData.publicUrl
      });

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });

    } catch (error: any) {
      console.error('Upload error:', error);
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
  
  const handleUrlChange = (url: string) => {
    setError(null);
    setPreviewUrl(url);
    onImageUploaded({ path: '', url });
  };
  
  const handleClearImage = () => {
    setError(null);
    setPreviewUrl('');
    onImageUploaded({ path: '', url: '' });
  };
  
  return (
    <div className="space-y-2 w-full">
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-100 border">
          {previewUrl ? (
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder.svg';
                console.error('Image failed to load:', previewUrl);
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
          value={previewUrl}
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
        
        {previewUrl && (
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
