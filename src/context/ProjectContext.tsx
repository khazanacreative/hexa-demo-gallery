
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Project } from '@/types';
import { projects as initialProjects } from '@/data/mockData';
import { toast } from '@/components/ui/use-toast';
import { supabase, projectOperations } from '@/integrations/supabase/client';
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

  // Fetch projects on initial load
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        console.log('[ProjectContext] Fetching projects from database...');
        
        // Get session to check auth status
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[ProjectContext] Auth session:', session ? 'Active' : 'None');
        
        let data;
        try {
          data = await projectOperations.fetchProjects();
        } catch (error) {
          console.error('[ProjectContext] Error using projectOperations:', error);
          
          // Fallback to direct query
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (fallbackError) {
            console.error('[ProjectContext] Supabase fallback error:', fallbackError);
            throw fallbackError;
          }
          
          data = fallbackData;
        }
        
        console.log('[ProjectContext] Fetched projects:', data);
        
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
          
          console.log('[ProjectContext] Mapped projects:', fetchedProjects);
          setProjects(fetchedProjects);
        } else {
          console.log('[ProjectContext] No projects found in database, using initial data');
          // Convert the initial projects to have UUID format IDs
          const projectsWithUuids = initialProjects.map(p => ({
            ...p,
            id: crypto.randomUUID(),
            features: p.features || []
          }));
          setProjects(projectsWithUuids);
          
          // If user is authenticated, we can add these initial projects to the database
          if (session && session.user) {
            console.log('[ProjectContext] Adding initial projects to database');
            try {
              for (const project of projectsWithUuids) {
                const projectData = {
                  title: project.title,
                  description: project.description || '',
                  cover_image: project.coverImage,
                  screenshots: project.screenshots,
                  demo_url: project.demoUrl,
                  category: project.category,
                  tags: project.tags,
                  features: project.features || [],
                  user_id: session.user.id
                };
                
                await supabase.from('projects').insert(projectData);
              }
            } catch (err) {
              console.error('[ProjectContext] Error adding initial projects to database:', err);
            }
          }
        }
      } catch (error) {
        console.error('[ProjectContext] Error fetching projects:', error);
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
    };
    
    fetchProjects();
  }, []);

  // Add a project
  const addProject = useCallback(async (projectData: Omit<Project, 'id' | 'createdAt'> | Project) => {
    try {
      // Get session to check auth status
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "You must be logged in to add projects.",
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
      
      console.log('[ProjectContext] Adding new project with data:', projectDataForBackend);
      
      // Try to add using helper
      let newProjectFromDB;
      try {
        newProjectFromDB = await projectOperations.addProject(projectDataForBackend, session.user.id);
      } catch (error) {
        console.error('[ProjectContext] Error using projectOperations for add:', error);
        
        // Fallback to direct query
        const { data, error: insertError } = await supabase
          .from('projects')
          .insert({
            ...projectDataForBackend,
            user_id: session.user.id
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
      console.error('[ProjectContext] Error adding project:', error);
      toast({
        title: "Error",
        description: "Gagal menambahkan project ke database. Silakan coba lagi.",
        variant: "destructive"
      });
      return null;
    }
  }, []);

  // Update a project
  const updateProject = useCallback(async (updatedProject: Project) => {
    try {
      // Get session to check auth status
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "You must be logged in to update projects.",
          variant: "destructive"
        });
        return null;
      }
      
      if(!updatedProject.id) {
        toast({
          title: "Error",
          description: "Project ID is missing.",
          variant: "destructive",
        });
        return null;
      }
      
      console.log('[ProjectContext] Updating project with ID:', updatedProject.id);
      
      // Prepare data for backend
      const projectDataForBackend = {
        title: updatedProject.title,
        description: updatedProject.description || '',
        cover_image: updatedProject.coverImage,
        screenshots: updatedProject.screenshots,
        demo_url: updatedProject.demoUrl,
        category: updatedProject.category,
        tags: updatedProject.tags,
        features: updatedProject.features,
        user_id: session.user.id
      };
      
      console.log('[ProjectContext] Update data:', projectDataForBackend);
      
      // Try to update using helper
      let updatedProjectFromDB;
      try {
        updatedProjectFromDB = await projectOperations.updateProject(
          updatedProject.id, 
          projectDataForBackend, 
          session.user.id
        );
      } catch (error) {
        console.error('[ProjectContext] Error using projectOperations for update:', error);
        
        // Fallback to direct query
        const { data, error: updateError } = await supabase
          .from('projects')
          .update({
            ...projectDataForBackend,
            updated_at: new Date().toISOString()
          })
          .eq('id', updatedProject.id)
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
      console.error('[ProjectContext] Error updating project:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui project di database. Silakan coba lagi.",
        variant: "destructive"
      });
      return null;
    }
  }, []);

  // Delete a project
  const deleteProject = useCallback(async (id: string) => {
    try {
      // Get session to check auth status
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "You must be logged in to delete projects.",
          variant: "destructive"
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
      
      console.log('[ProjectContext] Deleting project with ID:', id);
      
      // Immediately update UI state to avoid lag
      setProjects(prev => prev.filter(p => p.id !== id));
      
      try {
        // Try to delete using projectOperations
        await projectOperations.deleteProject(id, session.user.id);
        
        toast({
          title: "Project berhasil dihapus",
          description: `${projectToDelete?.title || "Project"} telah dihapus dari database.`,
          variant: "destructive",
        });
        
        return true;
      } catch (error: any) {
        console.error('[ProjectContext] Error using projectOperations for delete:', error);
        
        // If there was an error, try a direct delete
        try {
          const { error: deleteError } = await supabase
            .from('projects')
            .delete()
            .eq('id', id);
          
          if (deleteError) {
            console.error('[ProjectContext] Direct delete also failed:', deleteError);
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
      console.error('[ProjectContext] Error deleting project:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus project dari database. Silakan coba lagi.",
        variant: "destructive"
      });
      return false;
    }
  }, [projects]);

  const toggleTagSelection = useCallback((tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  }, []);

  // Filter projects based on search query, category, and tags
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
