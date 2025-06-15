
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Project } from '@/types';
import { projects as initialProjects } from '@/data/mockData';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface ProjectContextType {
  projects: Project[];
  filteredProjects: Project[];
  searchQuery: string;
  selectedCategory: string | null;
  selectedTags: string[];
  addProject: (project: Project) => void;
  updateProject: (project: Project) => void;
  deleteProject: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  toggleTagSelection: (tag: string) => void;
  refreshProjects: () => Promise<void>;
  isLoading: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Fetching projects from database...');
      console.log('Current user in fetchProjects:', currentUser);
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase error:', error);
        // Fallback to initial projects if database fails
        const projectsWithUuids = initialProjects.map(p => ({
          ...p,
          id: crypto.randomUUID(),
          features: p.features || []
        }));
        setProjects(projectsWithUuids);
        return;
      }
      
      console.log('Fetched projects:', data?.length || 0);
      
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
        
        setProjects(fetchedProjects);
      } else {
        console.log('No projects found in database, using initial data');
        const projectsWithUuids = initialProjects.map(p => ({
          ...p,
          id: crypto.randomUUID(),
          features: p.features || []
        }));
        setProjects(projectsWithUuids);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      
      const projectsWithUuids = initialProjects.map(p => ({
        ...p,
        id: crypto.randomUUID(),
        features: p.features || []
      }));
      setProjects(projectsWithUuids);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchProjects();
    
    const projectsSubscription = supabase
      .channel('projects_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, (payload) => {
        console.log('Projects change detected:', payload);
        fetchProjects();
      })
      .subscribe();
    
    return () => {
      projectsSubscription.unsubscribe();
    };
  }, [fetchProjects]);

  const addProject = useCallback((project: Project) => {
    console.log('Adding project to context:', project);
    setProjects(prev => [project, ...prev]);
  }, []);

  const updateProject = useCallback((updatedProject: Project) => {
    console.log('Updating project in context:', updatedProject);
    setProjects(prev => 
      prev.map(p => p.id === updatedProject.id ? updatedProject : p)
    );
  }, []);

  const deleteProject = useCallback((id: string) => {
    console.log('Deleting project from context:', id);
    setProjects(prev => prev.filter(p => p.id !== id));
  }, []);

  const toggleTagSelection = useCallback((tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  }, []);

  const getUserAllowedCategories = useCallback(() => {
    if (!currentUser?.categoryPermissions) {
      return ['Web App', 'Mobile App']; // Default permissions
    }
    
    const categoryMap = {
      'web-app': 'Web App',
      'mobile-app': 'Mobile App', 
      'website': 'Website'
    };
    
    return currentUser.categoryPermissions.map(perm => categoryMap[perm]);
  }, [currentUser]);

  const filteredProjects = projects.filter(project => {
    const allowedCategories = getUserAllowedCategories();
    const categoryAllowed = allowedCategories.includes(project.category);
    
    const matchesSearch = searchQuery === '' || 
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === null || project.category === selectedCategory;
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => project.tags.includes(tag));
    
    return categoryAllowed && matchesSearch && matchesCategory && matchesTags;
  });

  return (
    <ProjectContext.Provider 
      value={{ 
        projects: filteredProjects, // Return filtered projects as base projects
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
        refreshProjects: fetchProjects,
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
