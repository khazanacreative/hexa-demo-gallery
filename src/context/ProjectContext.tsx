import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Project } from '@/types';
import { projects as initialProjects } from '@/data/mockData';
import { toast } from '@/components/ui/use-toast';
import { supabase, projectOperations, ensureStorageBuckets } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface ProjectContextType {
  projects: Project[];
  filteredProjects: Project[];
  searchQuery: string;
  selectedCategory: string | null;
  selectedTags: string[];
  addProject: (project: Omit<Project, 'id' | 'createdAt'> | Project) => Promise<Project | null>;
  updateProject: (project: Project) => Promise<Project | null>;
  deleteProject: (id: string) => Promise<boolean>;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  toggleTagSelection: (tag: string) => void;
  isLoading: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser, isAuthenticated } = useAuth();

  // Ensure storage buckets exist when context is initialized
  useEffect(() => {
    ensureStorageBuckets();
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching projects from database...');
        
        let data;
        try {
          data = await projectOperations.fetchProjects();
        } catch (error) {
          console.error('Error using projectOperations:', error);
          
          // Fallback to direct query
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (fallbackError) {
            console.error('Supabase fallback error:', fallbackError);
            throw fallbackError;
          }
          
          data = fallbackData;
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
            createdAt: item.created_at || new Date().toISOString()
          }));
          
          console.log('Mapped projects:', fetchedProjects);
          setProjects(fetchedProjects);
        } else {
          console.log('No projects found in database, using initial data');
          // Convert the initial projects to have UUID format IDs
          const projectsWithUuids = initialProjects.map(p => ({
            ...p,
            id: crypto.randomUUID(), // Generate proper UUIDs instead of simple strings
            features: p.features || []
          }));
          setProjects(projectsWithUuids);
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
          id: crypto.randomUUID(), // Generate proper UUIDs instead of simple strings
          features: p.features || []
        }));
        setProjects(projectsWithUuids);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProjects();
  }, []);

  const addProject = useCallback(async (projectData: Omit<Project, 'id' | 'createdAt'> | Project) => {
    try {
      if (!currentUser) {
        toast({
          title: "Error",
          description: "User not authenticated. Please login.",
          variant: "destructive"
        });
        return null;
      }
      
      // If project already has id and createdAt (like when importing), use it directly
      if ('id' in projectData && 'createdAt' in projectData) {
        setProjects(prev => [projectData as Project, ...prev]);
        toast({
          title: "Project added",
          description: `${projectData.title} has been added successfully.`,
        });
        return projectData as Project;
      }
      
      // Prepare data for backend
      const projectDataForBackend = {
        title: projectData.title,
        description: projectData.description || '',
        cover_image: projectData.coverImage,
        screenshots: projectData.screenshots,
        demo_url: projectData.demoUrl,
        category: projectData.category,
        tags: projectData.tags,
        features: projectData.features || []
      };
      
      // Try to add using helper
      let newProjectFromDB;
      try {
        newProjectFromDB = await projectOperations.addProject(projectDataForBackend, currentUser.id);
      } catch (error) {
        console.error('Error using projectOperations for add:', error);
        
        // Fallback to direct query
        const { data, error: insertError } = await supabase
          .from('projects')
          .insert({
            ...projectDataForBackend,
            user_id: currentUser.id
          })
          .select()
          .single();
        
        if (insertError) throw insertError;
        newProjectFromDB = data;
      }
      
      // Transform to frontend model
      const newProject: Project = {
        id: newProjectFromDB.id,
        title: newProjectFromDB.title,
        description: newProjectFromDB.description || '',
        coverImage: newProjectFromDB.cover_image || '',
        screenshots: newProjectFromDB.screenshots || [],
        demoUrl: newProjectFromDB.demo_url || '',
        category: newProjectFromDB.category || '',
        tags: newProjectFromDB.tags || [],
        features: newProjectFromDB.features || [],
        createdAt: newProjectFromDB.created_at || new Date().toISOString()
      };

      setProjects(prev => [newProject, ...prev]);
      toast({
        title: "Project berhasil ditambahkan",
        description: `${newProject.title} telah berhasil disimpan ke database.`,
      });
      
      return newProject;
    } catch (error) {
      console.error('Error adding project:', error);
      toast({
        title: "Error",
        description: "Gagal menambahkan project ke database. Silakan coba lagi.",
        variant: "destructive"
      });
      return null;
    }
  }, [currentUser]);

  const updateProject = useCallback(async (updatedProject: Project) => {
    try {
      if(!currentUser) {
        toast({
          title: "Error",
          description: "User not authenticated. Please login.",
          variant: "destructive",
        });
        return null;
      }
      
      if(!updatedProject.id) {
        toast({
          title: "Error",
          description: "Project id is missing.",
          variant: "destructive",
        });
        return null;
      }
      
      console.log('Updating project with ID:', updatedProject.id);
      
      // Prepare data for backend
      const projectDataForBackend = {
        title: updatedProject.title,
        description: updatedProject.description || '',
        cover_image: updatedProject.coverImage,
        screenshots: updatedProject.screenshots,
        demo_url: updatedProject.demoUrl,
        category: updatedProject.category,
        tags: updatedProject.tags,
        features: updatedProject.features
      };
      
      // Try to update using helper
      let updatedProjectFromDB;
      try {
        updatedProjectFromDB = await projectOperations.updateProject(
          updatedProject.id, 
          projectDataForBackend, 
          currentUser.id
        );
      } catch (error) {
        console.error('Error using projectOperations for update:', error);
        
        // Fallback to direct query
        const { data, error: updateError } = await supabase
          .from('projects')
          .update({
            ...projectDataForBackend,
            updated_at: new Date().toISOString()
          })
          .eq('id', updatedProject.id)
          .eq('user_id', currentUser.id)
          .select()
          .single();
        
        if (updateError) throw updateError;
        updatedProjectFromDB = data;
      }
      
      // Update local state
      setProjects(prev => 
        prev.map(p => p.id === updatedProject.id ? updatedProject : p)
      );
      
      toast({
        title: "Project berhasil diperbarui",
        description: `${updatedProject.title} telah berhasil diperbarui dalam database.`,
      });
      
      return updatedProject;
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui project di database. Silakan coba lagi.",
        variant: "destructive"
      });
      return null;
    }
  }, [currentUser]);

  const deleteProject = useCallback(async (id: string) => {
    try {
      if(!currentUser) {
        toast({
          title: "Error",
          description: "User not authenticated. Please login.",
          variant: "destructive",
        });
        return false;
      }
      
      const projectToDelete = projects.find(p => p.id === id);
      if (!projectToDelete) {
        toast({
          title: "Error",
          description: "Project not found.",
          variant: "destructive",
        });
        return false;
      }
      
      console.log('Deleting project with ID:', id);
      
      // Immediately update UI state to avoid lag
      setProjects(prev => prev.filter(p => p.id !== id));
      
      try {
        // Try to delete using projectOperations
        await projectOperations.deleteProject(id, currentUser.id);
        
        toast({
          title: "Project berhasil dihapus",
          description: `${projectToDelete?.title || "Project"} telah dihapus dari database.`,
          variant: "destructive",
        });
        
        return true;
      } catch (error: any) {
        console.error('Error using projectOperations for delete:', error);
        
        // If there was an error, try a direct delete
        try {
          const { error: deleteError } = await supabase
            .from('projects')
            .delete()
            .eq('id', id);
          
          if (deleteError) {
            console.error('Direct delete also failed:', deleteError);
            // Revert local state change
            setProjects(prev => [projectToDelete, ...prev.filter(p => p.id !== id)]);
            throw deleteError;
          }
          
          toast({
            title: "Project berhasil dihapus",
            description: `${projectToDelete?.title || "Project"} telah dihapus dari database.`,
            variant: "destructive",
          });
          
          return true;
        } catch (finalError) {
          // Revert local state change if all attempts fail
          setProjects(prev => [projectToDelete, ...prev.filter(p => p.id !== id)]);
          throw finalError;
        }
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus project dari database. Silakan coba lagi.",
        variant: "destructive"
      });
      return false;
    }
  }, [currentUser, projects]);

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
        isLoading
      }}
    >
      {children}
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
