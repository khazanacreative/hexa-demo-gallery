
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { HexaButton } from '@/components/ui/hexa-button';
import { FormLabel } from '@/components/ui/form';
import { X, Plus } from 'lucide-react';

interface TagSelectorProps {
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  availableTags: string[];
}

const TagSelector = ({ selectedTags, setSelectedTags, availableTags }: TagSelectorProps) => {
  const [newTag, setNewTag] = useState('');

  const addTag = () => {
    if (newTag && !selectedTags.includes(newTag)) {
      setSelectedTags([...selectedTags, newTag]);
      setNewTag('');
    }
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  return (
    <div className="space-y-2">
      <FormLabel>Tags</FormLabel>
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedTags.map(tag => (
          <div key={tag} className="bg-accent text-foreground px-3 py-1 rounded-full text-sm flex items-center gap-1">
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Add new tag"
          value={newTag}
          onChange={e => setNewTag(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag();
            }
          }}
        />
        <HexaButton
          type="button"
          onClick={addTag}
          variant="outline"
          size="icon"
        >
          <Plus size={16} />
        </HexaButton>
      </div>
      <div className="mt-2">
        <p className="text-sm text-gray-500 mb-1">Common tags:</p>
        <div className="flex flex-wrap gap-1">
          {availableTags.filter(tag => !selectedTags.includes(tag)).slice(0, 10).map(tag => (
            <button
              key={tag}
              type="button"
              className="bg-secondary text-foreground px-2 py-0.5 rounded-full text-xs"
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TagSelector;
