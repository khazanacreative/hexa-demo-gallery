
import { ReactNode, useEffect } from 'react';
import { useProjectDatabase } from './useProjectDatabase';
import { useProjectFilters } from './useProjectFilters';
import { Project } from '@/types';

import ProjectContext from './ProjectContext';

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const db = useProjectDatabase();
  const filters = useProjectFilters(db.projects);

  // Fetch inited on mount
  useEffect(() => {
    db.fetchProjects();
  }, [db.fetchProjects]);

  return (
    <ProjectContext.Provider value={{
      projects: db.projects,
      filteredProjects: filters.filteredProjects,
      searchQuery: filters.searchQuery,
      selectedCategory: filters.selectedCategory,
      selectedTags: filters.selectedTags,
      addProject: db.addProject,
      updateProject: db.updateProject,
      deleteProject: db.deleteProject,
      setSearchQuery: filters.setSearchQuery,
      setSelectedCategory: filters.setSelectedCategory,
      toggleTagSelection: filters.toggleTagSelection,
      isLoading: db.isLoading,
      refreshProjects: db.refreshProjects,
    }}>
      {children}
    </ProjectContext.Provider>
  );
};
