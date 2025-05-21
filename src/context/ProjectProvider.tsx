
import { ReactNode, useCallback } from 'react';
import { useProjects } from './database';
import { useProjectFilters } from './useProjectFilters';
import ProjectContext from './ProjectContext';

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const db = useProjects();
  const filters = useProjectFilters(db.projects);

  // Function to check if a project is favorited
  const isFavorite = useCallback((projectId: string) => {
    return db.favorites.includes(projectId);
  }, [db.favorites]);

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
      addFavorite: db.addFavorite,
      removeFavorite: db.removeFavorite,
      favorites: db.favorites,
      isFavorite,
      clearAllProjects: db.clearAllProjects
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export default ProjectProvider;
