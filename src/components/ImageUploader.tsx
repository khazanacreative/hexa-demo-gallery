
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
  const [storageReady, setStorageReady] = useState<boolean>(false);
  const [checkingStorage, setCheckingStorage] = useState<boolean>(true);
  const { currentUser } = useAuth();
  
  useEffect(() => {
    setPreviewUrl(currentImageUrl);
  }, [currentImageUrl]);

  useEffect(() => {
    checkStorageSetup();
  }, [bucketName]);

  const checkStorageSetup = async () => {
    try {
      setCheckingStorage(true);
      console.log('Checking storage setup for bucket:', bucketName);
      
      // Try to list buckets to check if our bucket exists
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      
      if (bucketError) {
        console.error('Error checking buckets:', bucketError);
        setStorageReady(false);
        setError('Storage tidak tersedia. Silakan gunakan URL gambar manual.');
        return;
      }

      const bucketExists = buckets?.some(bucket => bucket.id === bucketName) || false;
      console.log('Bucket exists:', bucketExists, 'Available buckets:', buckets?.map(b => b.id));
      
      if (!bucketExists) {
        console.warn(`Bucket ${bucketName} tidak ditemukan`);
        setStorageReady(false);
        setError('Storage bucket belum dikonfigurasi. Gunakan URL gambar manual.');
        return;
      }

      // Test upload permission with a small test
      try {
        const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });
        const testPath = `${folderPath}/test-${Date.now()}.txt`;
        
        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(testPath, testFile);
        
        if (uploadError) {
          console.error('Upload test failed:', uploadError);
          setStorageReady(false);
          setError('Upload tidak diizinkan. Pastikan Anda sudah login.');
          return;
        }

        // Clean up test file
        await supabase.storage.from(bucketName).remove([testPath]);
        
        setStorageReady(true);
        setError(null);
        console.log('Storage setup check passed');
        
      } catch (testError) {
        console.error('Storage test error:', testError);
        setStorageReady(false);
        setError('Storage test gagal. Gunakan URL gambar manual.');
      }
      
    } catch (error) {
      console.error('Storage check error:', error);
      setStorageReady(false);
      setError('Gagal memeriksa storage. Gunakan URL gambar manual.');
    } finally {
      setCheckingStorage(false);
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

      if (!storageReady) {
        throw new Error('Storage belum siap. Silakan coba lagi atau gunakan URL gambar manual.');
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
        throw new Error(`Error upload: ${error.message}`);
      }

      if (!data) {
        throw new Error('Upload gagal - tidak ada data yang dikembalikan');
      }

      console.log('Upload successful:', data);

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);
      
      console.log('Public URL generated:', urlData.publicUrl);

      const publicUrl = urlData.publicUrl;
      
      // Update preview immediately
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
            disabled={uploading || checkingStorage || !storageReady}
            title={
              checkingStorage ? "Memeriksa storage..." :
              !storageReady ? "Upload tidak tersedia" : 
              "Upload gambar"
            }
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Image size={16} />}
          </HexaButton>
          <input 
            type="file"
            accept="image/*"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={uploadImage}
            disabled={uploading || checkingStorage || !storageReady}
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

      {checkingStorage && (
        <div className="text-blue-600 text-xs flex items-center gap-1">
          <Loader2 size={12} className="animate-spin" />
          <span>Memeriksa storage...</span>
        </div>
      )}

      {!checkingStorage && !storageReady && (
        <div className="text-amber-600 text-xs flex items-center gap-1">
          <AlertCircle size={12} />
          <span>Upload dinonaktifkan. Gunakan URL gambar manual.</span>
        </div>
      )}

      {!checkingStorage && storageReady && (
        <div className="text-green-600 text-xs flex items-center gap-1">
          <span>✓</span>
          <span>Upload siap digunakan</span>
        </div>
      )}
      
      <div className="text-xs text-gray-500">
        Format yang didukung: JPEG, PNG, GIF, WEBP, SVG (max {maxSizeInMB}MB)
      </div>
    </div>
  );
};

export default ImageUploader;
