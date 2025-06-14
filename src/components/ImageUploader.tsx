
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
  const [bucketExists, setBucketExists] = useState<boolean | null>(null);
  const { currentUser } = useAuth();
  
  useEffect(() => {
    setPreviewUrl(currentImageUrl);
  }, [currentImageUrl]);

  useEffect(() => {
    checkBucketExists();
  }, [bucketName]);

  const checkBucketExists = async () => {
    try {
      console.log('Checking if bucket exists:', bucketName);
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('Error checking buckets:', error);
        setBucketExists(false);
        return;
      }

      const exists = buckets?.some(bucket => bucket.id === bucketName) || false;
      console.log('Bucket exists:', exists, 'Available buckets:', buckets?.map(b => b.id));
      setBucketExists(exists);

      if (!exists) {
        console.log('Bucket not found, attempting to create it...');
        await createBucket();
      }
    } catch (error) {
      console.error('Error in checkBucketExists:', error);
      setBucketExists(false);
    }
  };

  const createBucket = async () => {
    try {
      console.log('Creating bucket:', bucketName);
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: maxSizeInMB * 1024 * 1024,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
      });

      if (error) {
        console.error('Error creating bucket:', error);
        
        // Check if bucket already exists
        if (error.message?.includes('already exists')) {
          console.log('Bucket already exists, setting as available');
          setBucketExists(true);
          return;
        }
        
        throw error;
      }

      console.log('Bucket created successfully:', data);
      setBucketExists(true);
    } catch (error) {
      console.error('Failed to create bucket:', error);
      setBucketExists(false);
    }
  };
  
  const validateFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setError(`Tipe file tidak valid. Format yang diizinkan: JPEG, PNG, GIF, WEBP, SVG`);
      return false;
    }
    
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      setError(`Ukuran file melebihi batas maksimal ${maxSizeInMB}MB`);
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
        throw new Error('Anda harus memilih gambar untuk diupload.');
      }

      console.log('Starting upload process, current user:', currentUser);
      
      const file = event.target.files[0];
      console.log('Selected file:', file.name, file.size, file.type);
      
      if (!validateFile(file)) {
        setUploading(false);
        return;
      }

      // Check if bucket exists before uploading
      if (bucketExists === false) {
        console.log('Bucket does not exist, trying to create it...');
        await createBucket();
        
        // Recheck bucket status
        if (bucketExists === false) {
          throw new Error('Storage bucket tidak tersedia dan tidak dapat dibuat. Silakan hubungi administrator.');
        }
      }
      
      // Create unique filename
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      const filePath = `${folderPath}/${fileName}.${fileExt}`;
      
      console.log(`Uploading image to: ${bucketName}/${filePath}`);
      
      // Upload the file
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.error('Storage error details:', error);
        
        // Handle specific error cases
        if (error.message.includes('row-level security')) {
          throw new Error('Anda tidak memiliki izin untuk mengupload file. Silakan login terlebih dahulu.');
        } else if (error.message.includes('file size')) {
          throw new Error(`Ukuran file terlalu besar. Maksimal ${maxSizeInMB}MB.`);
        } else if (error.message.includes('file type')) {
          throw new Error('Tipe file tidak didukung. Gunakan format JPEG, PNG, GIF, WEBP, atau SVG.');
        } else if (error.message.includes('not found')) {
          // Bucket might have been deleted, try to recreate
          console.log('Bucket not found during upload, recreating...');
          await createBucket();
          throw new Error('Storage bucket tidak ditemukan. Silakan coba lagi.');
        } else {
          throw new Error(`Error upload: ${error.message}`);
        }
      }

      if (!data) {
        throw new Error('Upload gagal - tidak ada data yang dikembalikan');
      }

      console.log('Upload successful:', data);

      // Get the public URL - perbaikan di sini untuk memastikan URL benar
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);
      
      console.log('Public URL generated:', urlData.publicUrl);

      // Pastikan URL menggunakan format yang benar
      const publicUrl = urlData.publicUrl;
      
      // Update preview immediately dengan URL yang benar
      setPreviewUrl(publicUrl);
      onImageUploaded({
        path: data.path,
        url: publicUrl
      });

      toast({
        title: "Berhasil",
        description: "Gambar berhasil diupload",
      });

    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : "Gagal mengupload gambar";
      setError(errorMessage);
      toast({
        title: "Upload gagal",
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
                console.error('Gambar gagal dimuat:', previewUrl);
                setError('Gambar gagal dimuat. Silakan coba upload ulang.');
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
          placeholder="URL gambar atau upload"
          value={previewUrl}
          onChange={(e) => handleUrlChange(e.target.value)}
        />
        
        <div className="relative">
          <HexaButton 
            type="button" 
            variant="outline" 
            size="icon" 
            className="flex-shrink-0"
            disabled={uploading || bucketExists === false}
            title={bucketExists === false ? "Storage tidak tersedia" : "Upload gambar"}
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Image size={16} />}
          </HexaButton>
          <input 
            type="file"
            accept="image/*"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={uploadImage}
            disabled={uploading || bucketExists === false}
            title="Pilih gambar untuk diupload"
          />
        </div>
        
        {previewUrl && (
          <HexaButton
            type="button"
            variant="outline"
            size="icon"
            className="flex-shrink-0"
            onClick={handleClearImage}
            title="Hapus gambar"
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

      {bucketExists === false && (
        <div className="text-amber-600 text-xs flex items-center gap-1">
          <AlertCircle size={12} />
          <span>Storage bucket tidak tersedia. Upload dinonaktifkan sementara.</span>
        </div>
      )}
      
      <div className="text-xs text-gray-500">
        Format yang didukung: JPEG, PNG, GIF, WEBP, SVG (max {maxSizeInMB}MB)
      </div>
    </div>
  );
};

export default ImageUploader;
