import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HexaButton } from '@/components/ui/hexa-button';
import { X, Plus, Link, Tag, Lightbulb } from 'lucide-react';
import { useProjects } from '@/context/ProjectContext';
import ImageUploader from './ImageUploader';
import { Project, FileUploadResult } from '@/types';

type ProjectFormValues = Omit<Project, 'id' | 'createdAt'>;

interface ProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectFormValues) => void;
  defaultValues?: Project;
  title: string;
}

const ProjectForm = ({
  isOpen,
  onClose,
  onSubmit,
  defaultValues,
  title
}: ProjectFormProps) => {
  const [screenshots, setScreenshots] = useState<string[]>(
    defaultValues?.screenshots || ['/placeholder.svg']
  );
  const [newTag, setNewTag] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(
    defaultValues?.tags || []
  );
  const [coverImage, setCoverImage] = useState(defaultValues?.coverImage || '/placeholder.svg');
  const [features, setFeatures] = useState<string[]>(
    defaultValues?.features || []
  );
  const [newFeature, setNewFeature] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(
    defaultValues?.category || 'Web App'
  );

  const { allowedCategories, allowedTags } = useProjects();

  const form = useForm<ProjectFormValues>({
    defaultValues: defaultValues || {
      title: '',
      description: '',
      coverImage: '/placeholder.svg',
      screenshots: ['/placeholder.svg'],
      demoUrl: 'https://example.com',
      category: allowedCategories[0] || 'Web App',
      tags: [],
      features: [],
    },
  });

  const addScreenshot = () => {
    setScreenshots([...screenshots, '/placeholder.svg']);
  };

  const removeScreenshot = (index: number) => {
    setScreenshots(screenshots.filter((_, i) => i !== index));
  };

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

  const removeTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleCoverImageUploaded = (result: FileUploadResult) => {
    setCoverImage(result.url);
  };

  const handleScreenshotUploaded = (index: number, result: FileUploadResult) => {
    const newScreenshots = [...screenshots];
    newScreenshots[index] = result.url;
    setScreenshots(newScreenshots);
  };

  const addFeature = () => {
    if (newFeature && !features.includes(newFeature)) {
      setFeatures([...features, newFeature]);
      setNewFeature('');
    }
  };

  const removeFeature = (feature: string) => {
    setFeatures(features.filter(f => f !== feature));
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    form.setValue('category', category);
  };

  const handleSubmit = (data: ProjectFormValues) => {
    onSubmit({
      ...data,
      coverImage,
      screenshots,
      tags: selectedTags,
      features,
      category: selectedCategory,
    });
    onClose();
  };

  const getSuggestedTags = () => {
    // Filter suggested tags to only show allowed ones
    return allowedTags
      .filter(tag => !selectedTags.includes(tag))
      .slice(0, 12);
  };

  return (
    <Dialog open={isOpen} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl w-[90vw]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[75vh] overflow-y-auto px-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pr-3">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Project title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Project description"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4">
                <FormItem>
                  <FormLabel>Cover Image</FormLabel>
                  <FormControl>
                    <ImageUploader 
                      currentImageUrl={coverImage}
                      onImageUploaded={handleCoverImageUploaded}
                      bucketName="project-images"
                      folderPath="covers"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
                
                <FormField
                  control={form.control}
                  name="demoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Demo URL</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input placeholder="https://" {...field} />
                          <HexaButton type="button" variant="outline" size="icon" className="flex-shrink-0">
                            <Link size={16} />
                          </HexaButton>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <select
                    className="w-full p-2 border border-gray-200 rounded-md"
                    value={selectedCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                  >
                    {allowedCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>

              <div className="space-y-2">
                <FormLabel>Screenshots</FormLabel>
                <div className="space-y-2">
                  {screenshots.map((screenshot, i) => (
                    <div key={i}>
                      <ImageUploader 
                        currentImageUrl={screenshot}
                        onImageUploaded={(result) => handleScreenshotUploaded(i, result)}
                        bucketName="project-images"
                        folderPath="screenshots"
                        className="mb-2"
                      />
                      {screenshots.length > 1 && (
                        <HexaButton
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeScreenshot(i)}
                          className="mb-2"
                        >
                          <X size={16} className="mr-1" />
                          Remove Screenshot
                        </HexaButton>
                      )}
                    </div>
                  ))}
                  <HexaButton
                    type="button"
                    variant="outline"
                    onClick={addScreenshot}
                    className="w-full mt-2"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Screenshot
                  </HexaButton>
                </div>
              </div>

              <div className="space-y-3">
                <FormLabel className="flex items-center gap-2">
                  <Tag size={16} />
                  Tags
                </FormLabel>
                
                {/* Selected Tags */}
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedTags.map(tag => (
                      <div key={tag} className="bg-hexa-red text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-white/80 hover:text-white"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add New Tag */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom tag"
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
                
                {/* Suggested Tags - Filtered by user permissions */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Lightbulb size={14} />
                    <span>Suggested tags for {selectedCategory}:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {getSuggestedTags().map(tag => (
                      <button
                        key={tag}
                        type="button"
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs transition-colors"
                        onClick={() => toggleTag(tag)}
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

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

              <div className="flex justify-end gap-2 pt-4">
                <HexaButton type="button" variant="outline" onClick={onClose}>
                  Cancel
                </HexaButton>
                <HexaButton type="submit" variant="hexa">
                  {defaultValues ? 'Update Project' : 'Add Project'}
                </HexaButton>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectForm;
