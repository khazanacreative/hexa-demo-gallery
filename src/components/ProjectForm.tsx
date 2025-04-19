
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HexaButton } from '@/components/ui/hexa-button';
import { X, Plus, Link } from 'lucide-react';
import { allTags } from '@/data/mockData';
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

  const form = useForm<ProjectFormValues>({
    defaultValues: defaultValues || {
      title: '',
      description: '',
      coverImage: '/placeholder.svg',
      screenshots: ['/placeholder.svg'],
      demoUrl: 'https://example.com',
      category: 'Web App',
      tags: [],
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

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const handleCoverImageUploaded = (result: FileUploadResult) => {
    setCoverImage(result.url);
  };

  const handleScreenshotUploaded = (index: number, result: FileUploadResult) => {
    const newScreenshots = [...screenshots];
    newScreenshots[index] = result.url;
    setScreenshots(newScreenshots);
  };

  const handleSubmit = (data: ProjectFormValues) => {
    onSubmit({
      ...data,
      coverImage,
      screenshots,
      tags: selectedTags,
    });
    onClose();
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

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <select
                        className="w-full p-2 border border-gray-200 rounded-md"
                        {...field}
                      >
                        <option value="Web App">Web App</option>
                        <option value="Mobile App">Mobile App</option>
                        <option value="Website">Website</option>
                        <option value="Desktop App">Desktop App</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                    {allTags.filter(tag => !selectedTags.includes(tag)).slice(0, 10).map(tag => (
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
