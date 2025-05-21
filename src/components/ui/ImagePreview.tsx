
import React from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ImagePreviewProps {
  previewUrl: string | null;
  uploading: boolean;
  bucketExists: boolean | null;
  errorMessage: string | null;
  className?: string;
  bucketName: string;
  compact?: boolean;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
  previewUrl,
  uploading,
  bucketExists,
  errorMessage,
  className,
  bucketName,
  compact = false
}) => {
  return (
    <div className={cn(
      "relative w-full bg-gray-100 rounded-md overflow-hidden border border-gray-200",
      compact ? "aspect-[4/3]" : "aspect-video",
      className
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
  );
};

export default ImagePreview;
