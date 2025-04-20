
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Project } from '@/types';
import { projects as initialProjects } from '@/data/mockData';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ProjectContextType {
  projects: Project[];
  filteredProjects: Project[];
  searchQuery: string;
  selectedCategory: string | null;
  selectedTags: string[];
  addProject: (project: Omit<Project, 'id' | 'createdAt'> | Project) => Promise<void>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  toggleTagSelection: (tag: string) => void;
  isLoading: boolean;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Fetching projects from database...');
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Fetched projects:', data);
      
      if (data && data.length > 0) {
        const fetchedProjects: Project[] = data.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description || '',
          coverImage: item.cover_image || '',
          screenshots: item.screenshots || [],
          demoUrl: item.demo_url || '',
          category: item.category || '',
          tags: item.tags || [],
          features: item.features || [],
          createdAt: item.created_at
        }));
        
        console.log('Mapped projects:', fetchedProjects);
        setProjects(fetchedProjects);
      } else {
        console.log('No projects found in database, using initial data');
        // Convert the initial projects to have UUID format IDs
        const projectsWithUuids = initialProjects.map(p => ({
          ...p,
          id: crypto.randomUUID(),
          features: p.features || []
        }));
        setProjects(projectsWithUuids);
        
        // Save initial projects to database
        for (const project of projectsWithUuids) {
          await supabase
            .from('projects')
            .insert({
              id: project.id,
              title: project.title,
              description: project.description,
              cover_image: project.coverImage,
              screenshots: project.screenshots,
              demo_url: project.demoUrl,
              category: project.category,
              tags: project.tags,
              features: project.features
            });
        }
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data project",
        variant: "destructive"
      });
      
      // Convert the initial projects to have UUID format IDs
      const projectsWithUuids = initialProjects.map(p => ({
        ...p,
        id: crypto.randomUUID(),
        features: p.features || []
      }));
      setProjects(projectsWithUuids);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const addProject = useCallback(async (projectData: Omit<Project, 'id' | 'createdAt'> | Project) => {
    try {
      let newProject: Project;
      
      if ('id' in projectData && 'createdAt' in projectData) {
        newProject = projectData as Project;
      } else {
        newProject = {
          ...projectData as Omit<Project, 'id' | 'createdAt'>,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          features: (projectData as Omit<Project, 'id' | 'createdAt'>).features || []
        };
      }
      
      const { data, error } = await supabase
        .from('projects')
        .insert({
          id: newProject.id,
          title: newProject.title,
          description: newProject.description,
          cover_image: newProject.coverImage,
          screenshots: newProject.screenshots,
          demo_url: newProject.demoUrl,
          category: newProject.category,
          tags: newProject.tags,
          features: newProject.features
        })
        .select('*')
        .single();
      
      if (error) {
        console.error('Error adding project to database:', error);
        throw error;
      }
      
      const addedProject: Project = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        coverImage: data.cover_image || '',
        screenshots: data.screenshots || [],
        demoUrl: data.demo_url || '',
        category: data.category || '',
        tags: data.tags || [],
        features: data.features || [],
        createdAt: data.created_at
      };
      
      setProjects(prev => [addedProject, ...prev]);
      
      toast({
        title: "Project added",
        description: `${newProject.title} has been added successfully.`,
      });
    } catch (error) {
      console.error('Error in addProject:', error);
      toast({
        title: "Error",
        description: "Gagal menambahkan project. Silakan coba lagi.",
        variant: "destructive"
      });
      throw error;
    }
  }, []);

  const updateProject = useCallback(async (updatedProject: Project) => {
    try {
      console.log('Updating project with ID:', updatedProject.id);
      
      const { error } = await supabase
        .from('projects')
        .update({
          title: updatedProject.title,
          description: updatedProject.description,
          cover_image: updatedProject.coverImage,
          screenshots: updatedProject.screenshots,
          demo_url: updatedProject.demoUrl,
          category: updatedProject.category,
          tags: updatedProject.tags,
          features: updatedProject.features,
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedProject.id);
      
      if (error) {
        console.error('Error updating project in database:', error);
        throw error;
      }
      
      // Re-fetch the project from the database to ensure we have the latest data
      const { data: refreshedData, error: refreshError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', updatedProject.id)
        .single();
      
      if (refreshError) {
        console.error('Error fetching updated project:', refreshError);
        throw refreshError;
      }
      
      const refreshedProject: Project = {
        id: refreshedData.id,
        title: refreshedData.title,
        description: refreshedData.description || '',
        coverImage: refreshedData.cover_image || '',
        screenshots: refreshedData.screenshots || [],
        demoUrl: refreshedData.demo_url || '',
        category: refreshedData.category || '',
        tags: refreshedData.tags || [],
        features: refreshedData.features || [],
        createdAt: refreshedData.created_at
      };
      
      setProjects(prev => 
        prev.map(p => p.id === refreshedProject.id ? refreshedProject : p)
      );
      
      toast({
        title: "Project updated",
        description: `${updatedProject.title} has been updated successfully.`,
      });
    } catch (error) {
      console.error('Error in updateProject:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui project. Silakan coba lagi.",
        variant: "destructive"
      });
      throw error;
    }
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    try {
      const projectToDelete = projects.find(p => p.id === id);
      
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting project from database:', error);
        throw error;
      }
      
      setProjects(prev => prev.filter(p => p.id !== id));
      
      toast({
        title: "Project deleted",
        description: `${projectToDelete?.title || "Project"} has been deleted.`,
        variant: "destructive",
      });
    } catch (error) {
      console.error('Error in deleteProject:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus project. Silakan coba lagi.",
        variant: "destructive"
      });
      throw error;
    }
  }, [projects]);

  const refreshProjects = useCallback(async () => {
    await fetchProjects();
  }, [fetchProjects]);

  const toggleTagSelection = useCallback((tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  }, []);

  const filteredProjects = projects.filter(project => {
    const matchesSearch = searchQuery === '' || 
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === null || project.category === selectedCategory;
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => project.tags.includes(tag));
    
    return matchesSearch && matchesCategory && matchesTags;
  });

  return (
    <ProjectContext.Provider 
      value={{ 
        projects, 
        filteredProjects,
        searchQuery,
        selectedCategory,
        selectedTags,
        addProject, 
        updateProject, 
        deleteProject,
        setSearchQuery,
        setSelectedCategory,
        toggleTagSelection,
        isLoading,
        refreshProjects
      }}
    >
      {isLoading ? (
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-hexa-red"></div>
        </div>
      ) : (
        children
      )}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};
