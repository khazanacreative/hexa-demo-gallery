import { useState } from 'react';
import { FileUploadResult } from '@/types';
import { HexaButton } from './ui/hexa-button';
import { Image, Loader2, X } from 'lucide-react';
import { toast } from './ui/use-toast';
import { supabase } from '../App';

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
  
  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 11)}_${Date.now()}.${fileExt}`;
      const filePath = `${folderPath}/${fileName}`;

      // Upload image to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);
        
      if (error) {
        throw error;
      }
      
      if (data) {
        // Get public URL for the uploaded file
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(data.path);
          
        onImageUploaded({
          path: data.path,
          url: urlData.publicUrl
        });
        
        toast({
          title: "Image uploaded",
          description: "Your image has been uploaded successfully."
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      // Reset the file input
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
          onClick={() => onImageUploaded({ path: '', url: '' })}
        >
          <X size={16} />
        </HexaButton>
      )}
    </div>
  );
};

export default ImageUploader;
