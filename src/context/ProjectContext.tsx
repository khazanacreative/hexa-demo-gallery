import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Project, CategoryPermission } from '@/types';
import { projects as initialProjects, tagSuggestionsByCategory, generalTechTags } from '@/data/mockData';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface ProjectContextType {
  projects: Project[];
  filteredProjects: Project[];
  searchQuery: string;
  selectedCategory: string | null;
  selectedTags: string[];
  allowedCategories: CategoryPermission[];
  allowedTags: string[];
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

  // Get allowed categories based on user permissions
  const allowedCategories: CategoryPermission[] = 
    currentUser?.role === 'admin' 
      ? ['Web App', 'Mobile App', 'Website', 'Desktop App']
      : currentUser?.categoryPermissions || ['Web App', 'Mobile App'];

  // Get allowed tags based on user's category permissions
  const allowedTags = (() => {
    let tags: string[] = [...generalTechTags];
    
    allowedCategories.forEach(category => {
      const categoryTags = tagSuggestionsByCategory[category] || [];
      tags = [...tags, ...categoryTags];
    });
    
    // Remove duplicates
    return [...new Set(tags)];
  })();

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

  const filteredProjects = projects.filter(project => {
    // Filter by user's category permissions
    const hasPermission = allowedCategories.includes(project.category as CategoryPermission);
    
    const matchesSearch = searchQuery === '' || 
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === null || project.category === selectedCategory;
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => project.tags.includes(tag));
    
    return hasPermission && matchesSearch && matchesCategory && matchesTags;
  });

  return (
    <ProjectContext.Provider 
      value={{ 
        projects, 
        filteredProjects,
        searchQuery,
        selectedCategory,
        selectedTags,
        allowedCategories,
        allowedTags,
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
