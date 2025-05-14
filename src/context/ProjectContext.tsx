
import { createContext, useContext } from 'react';
import { Project } from '@/types';

interface ProjectContextType {
  projects: Project[];
  filteredProjects: Project[];
  searchQuery: string;
  selectedCategory: string | null;
  selectedTags: string[];
  addProject: (project: Omit<Project, 'id' | 'createdAt'> | Project) => Promise<Project>;
  updateProject: (project: Project) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  toggleTagSelection: (tag: string) => void;
  isLoading: boolean;
  refreshProjects: () => Promise<void>;
  // Add favorite functionality
  addFavorite?: (projectId: string) => Promise<void>;
  removeFavorite?: (projectId: string) => Promise<void>;
  favorites?: string[];
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};

export default ProjectContext;
