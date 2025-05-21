
import React from 'react';
import { HexaButton } from './hexa-button';
import { Upload } from 'lucide-react';

interface UploadButtonProps {
  isPlaceholder: boolean;
  uploading: boolean;
  bucketExists: boolean | null;
  compact?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const UploadButton: React.FC<UploadButtonProps> = ({
  isPlaceholder,
  uploading,
  bucketExists,
  compact = false,
  onChange
}) => {
  return (
    <label className="w-full">
      <input
        type="file"
        accept="image/*"
        onChange={onChange}
        disabled={uploading || bucketExists === false}
        className="hidden"
      />
      <HexaButton
        type="button"
        variant={isPlaceholder ? "hexa" : "outline"}
        className="w-full"
        disabled={uploading || bucketExists === false}
        asChild
        size={compact ? "sm" : "default"}
      >
        <span>
          <Upload size={compact ? 14 : 16} className="mr-2" />
          {isPlaceholder ? "Upload" : "Change"}
        </span>
      </HexaButton>
    </label>
  );
};

export default UploadButton;
