
import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Project } from '@/types';
import { projects as initialProjects } from '@/data/mockData';
import { toast } from '@/components/ui/use-toast';

interface ProjectContextType {
  projects: Project[];
  filteredProjects: Project[];
  searchQuery: string;
  selectedCategory: string | null;
  selectedTags: string[];
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  updateProject: (project: Project) => void;
  deleteProject: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  toggleTagSelection: (tag: string) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const addProject = useCallback((projectData: Omit<Project, 'id' | 'createdAt'>) => {
    const newProject: Project = {
      ...projectData,
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

  // Apply filters and search to get filtered projects
  const filteredProjects = projects.filter(project => {
    // Apply search filter
    const matchesSearch = searchQuery === '' || 
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Apply category filter
    const matchesCategory = selectedCategory === null || project.category === selectedCategory;
    
    // Apply tags filter
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
