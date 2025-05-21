
import { useState } from 'react';
import { useProjects } from './useProjects';
import { useAdminOperations } from './useAdminOperations';

/**
 * Main hook that combines all project database functionality
 */
export function useProjectDatabase() {
  const [projects, setProjects] = useState([]);
  
  // Combine the functionality from the separate hooks
  const projectsData = useProjects();
  const adminOps = useAdminOperations(projectsData.setProjects);
  
  return {
    ...projectsData,
    ...adminOps,
  };
}
