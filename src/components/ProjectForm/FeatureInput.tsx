
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { HexaButton } from '@/components/ui/hexa-button';
import { FormLabel } from '@/components/ui/form';
import { X, Plus } from 'lucide-react';

interface FeatureInputProps {
  features: string[];
  setFeatures: (features: string[]) => void;
}

const FeatureInput = ({ features, setFeatures }: FeatureInputProps) => {
  const [newFeature, setNewFeature] = useState('');

  const addFeature = () => {
    if (newFeature && !features.includes(newFeature)) {
      setFeatures([...features, newFeature]);
      setNewFeature('');
    }
  };

  const removeFeature = (feature: string) => {
    setFeatures(features.filter(f => f !== feature));
  };

  return (
    <div className="space-y-2">
      <FormLabel>Key Features</FormLabel>
      <div className="flex flex-wrap gap-2 mb-2">
        {features.map(feature => (
          <div key={feature} className="bg-accent text-foreground px-3 py-1 rounded-full text-sm flex items-center gap-1">
            <span>{feature}</span>
            <button
              type="button"
              onClick={() => removeFeature(feature)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Add key feature"
          value={newFeature}
          onChange={e => setNewFeature(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addFeature();
            }
          }}
        />
        <HexaButton
          type="button"
          onClick={addFeature}
          variant="outline"
          size="icon"
        >
          <Plus size={16} />
        </HexaButton>
      </div>
    </div>
  );
};

export default FeatureInput;
