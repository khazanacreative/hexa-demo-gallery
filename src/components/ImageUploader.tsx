
import { useState } from 'react';
import { FileUploadResult } from '@/types';
import { HexaButton } from './ui/hexa-button';
import { Image, Loader2, X } from 'lucide-react';
import { toast } from './ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
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
  const { isAuthenticated } = useAuth();
  
  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
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
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      if (event.target) {
        event.target.value = '';
      }
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
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Image size={16} />}
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
          onClick={() => onImageUploaded({ path: '', url: '' })}
        >
          <X size={16} />
        </HexaButton>
      )}
    </div>
  );
};

export default ImageUploader;
