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
  addProject: (project: Omit<Project, 'id' | 'createdAt'> | Project) => void;
  updateProject: (project: Project) => void;
  deleteProject: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  toggleTagSelection: (tag: string) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
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
            createdAt: item.created_at
          }));
          
          setProjects(fetchedProjects);
        } else {
          setProjects(initialProjects);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: "Error",
          description: "Failed to load projects",
          variant: "destructive"
        });
        setProjects(initialProjects);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProjects();
  }, []);

  const addProject = useCallback((projectData: Omit<Project, 'id' | 'createdAt'> | Project) => {
    if ('id' in projectData && 'createdAt' in projectData) {
      setProjects(prev => [projectData as Project, ...prev]);
      toast({
        title: "Project added",
        description: `${projectData.title} has been added successfully.`,
      });
      return;
    }
    
    const newProject: Project = {
      ...projectData as Omit<Project, 'id' | 'createdAt'>,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    
    setProjects(prev => [newProject, ...prev]);
    toast({
      title: "Project added",
      description: `${newProject.title} has been added successfully.`,
    });
  }, []);

  const updateProject = useCallback((updatedProject: Project) => {
    setProjects(prev => 
      prev.map(p => p.id === updatedProject.id ? updatedProject : p)
    );
    toast({
      title: "Project updated",
      description: `${updatedProject.title} has been updated successfully.`,
    });
  }, []);

  const deleteProject = useCallback((id: string) => {
    const projectToDelete = projects.find(p => p.id === id);
    setProjects(prev => prev.filter(p => p.id !== id));
    toast({
      title: "Project deleted",
      description: `${projectToDelete?.title || "Project"} has been deleted.`,
      variant: "destructive",
    });
  }, [projects]);

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
        toggleTagSelection
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
