
import { useState } from 'react';
import { FileUploadResult } from '@/types';
import { HexaButton } from './ui/hexa-button';
import { Image, Loader2, X } from 'lucide-react';
import { toast } from './ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
      // Check if Supabase client is available
      if (!supabase) {
        throw new Error('Supabase client is not available.');
      }
      
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 11)}_${Date.now()}.${fileExt}`;
      const filePath = `${folderPath}/${fileName}`;

      // Check if bucket exists, create if not
      let { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('Error checking buckets:', bucketsError);
        throw bucketsError;
      }
      
      const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
      
      if (!bucketExists) {
        console.log('Bucket does not exist, creating:', bucketName);
        const { error: createBucketError } = await supabase.storage.createBucket(bucketName, {
          public: true
        });
        
        if (createBucketError) {
          console.error('Error creating bucket:', createBucketError);
          throw createBucketError;
        }
        
        // Re-fetch buckets to ensure it was created
        const { data: updatedBuckets } = await supabase.storage.listBuckets();
        console.log('Updated buckets after creation:', updatedBuckets);
      }

      // Upload image to Supabase Storage
      console.log(`Uploading file to ${bucketName}/${filePath}`);
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (error) {
        console.error('Error uploading file:', error);
        throw error;
      }
      
      console.log('Upload successful:', data);
      
      if (data) {
        // Get public URL for the uploaded file
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(data.path);
          
        console.log('Public URL:', urlData.publicUrl);
        
        onImageUploaded({
          path: data.path,
          url: urlData.publicUrl
        });
        
        toast({
          title: "Image uploaded",
          description: "Your image has been uploaded successfully."
        });
      }
    } catch (error: any) {
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
