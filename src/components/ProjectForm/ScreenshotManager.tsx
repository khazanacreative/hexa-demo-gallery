
import React from 'react';
import { FormLabel } from '@/components/ui/form';
import { HexaButton } from '@/components/ui/hexa-button';
import { X, Plus } from 'lucide-react';
import ImageUploader from '../ImageUploader';
import { FileUploadResult } from '@/types';

interface ScreenshotManagerProps {
  screenshots: string[];
  setScreenshots: (screenshots: string[]) => void;
}

const ScreenshotManager = ({ screenshots, setScreenshots }: ScreenshotManagerProps) => {
  const addScreenshot = () => {
    setScreenshots([...screenshots, '/placeholder.svg']);
  };

  const removeScreenshot = (index: number) => {
    setScreenshots(screenshots.filter((_, i) => i !== index));
  };

  const handleScreenshotUploaded = (index: number, result: FileUploadResult) => {
    const newScreenshots = [...screenshots];
    newScreenshots[index] = result.url;
    setScreenshots(newScreenshots);
  };

  return (
    <div className="space-y-2">
      <FormLabel>Screenshots</FormLabel>
      <div className="grid grid-cols-2 gap-2">
        {screenshots.map((screenshot, i) => (
          <div key={i} className="mb-2">
            <ImageUploader 
              currentImageUrl={screenshot}
              onImageUploaded={(result) => handleScreenshotUploaded(i, result)}
              bucketName="project-images"
              folderPath="screenshots"
              className="mb-1"
              compact={true}
            />
            {screenshots.length > 1 && (
              <HexaButton
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeScreenshot(i)}
                className="w-full mt-1"
              >
                <X size={14} className="mr-1" />
                Remove
              </HexaButton>
            )}
          </div>
        ))}
      </div>
      <HexaButton
        type="button"
        variant="outline"
        onClick={addScreenshot}
        className="w-full mt-2"
        size="sm"
      >
        <Plus size={14} className="mr-2" />
        Add Screenshot
      </HexaButton>
    </div>
  );
};

export default ScreenshotManager;
