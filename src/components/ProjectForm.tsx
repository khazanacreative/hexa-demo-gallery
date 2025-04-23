
import React, { useState, useEffect } from 'react';
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
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

// Separate components to reduce file size and improve maintainability
import TagSelector from './ProjectForm/TagSelector';
import FeatureInput from './ProjectForm/FeatureInput';
import ScreenshotManager from './ProjectForm/ScreenshotManager';

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
  const [selectedTags, setSelectedTags] = useState<string[]>(
    defaultValues?.tags || []
  );
  const [coverImage, setCoverImage] = useState(defaultValues?.coverImage || '/placeholder.svg');
  const [features, setFeatures] = useState<string[]>(
    defaultValues?.features || []
  );

  const form = useForm<ProjectFormValues>({
    defaultValues: defaultValues || {
      title: '',
      description: '',
      coverImage: '/placeholder.svg',
      screenshots: ['/placeholder.svg'],
      demoUrl: 'https://example.com',
      category: 'Web App',
      tags: [],
      features: [],
    },
  });

  const handleCoverImageUploaded = (result: FileUploadResult) => {
    setCoverImage(result.url);
  };

  const { currentUser } = useAuth();

  useEffect(() => {
    if (!isOpen) return; // Skip check if dialog is closed
    
    if (!currentUser) {
      toast({
        title: "Akses Ditolak",
        description: "Anda harus login terlebih dahulu.",
        variant: "destructive"
      });
      onClose();
      return;
    }
    
    if (currentUser.role !== 'admin') {
      toast({
        title: "Akses Ditolak",
        description: "Hanya admin yang dapat mengakses form project.",
        variant: "destructive"
      });
      onClose();
      return;
    }
  }, [currentUser, onClose, isOpen]);

  const handleSubmit = (data: ProjectFormValues) => {
    try {
      if (!currentUser || currentUser.role !== 'admin') {
        toast({
          title: "Akses Ditolak",
          description: "Hanya admin yang dapat mengedit data project.",
          variant: "destructive"
        });
        return;
      }

      onSubmit({
        ...data,
        coverImage,
        screenshots,
        tags: selectedTags,
        features,
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan data. Silakan coba lagi.",
        variant: "destructive"
      });
    }
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
              {/* Basic Details */}
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

              <div className="grid grid-cols-2 gap-4">
                {/* Cover Image */}
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
                
                {/* Demo URL */}
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

              {/* Category */}
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

              {/* Screenshots */}
              <ScreenshotManager
                screenshots={screenshots}
                setScreenshots={setScreenshots} 
              />

              {/* Tags */}
              <TagSelector 
                selectedTags={selectedTags}
                setSelectedTags={setSelectedTags}
                availableTags={allTags}
              />

              {/* Features - changed from "Key Features" to just "Features" */}
              <FeatureInput
                features={features}
                setFeatures={setFeatures}
              />

              {/* Submit Buttons */}
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
