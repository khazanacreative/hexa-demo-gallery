
import { useState, useEffect, useCallback } from 'react';
import { Project } from '@/types';
import ProjectCard from './ProjectCard';
import ProjectDetailsModal from './ProjectDetailsModal';
import ProjectForm from './ProjectForm';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import { useAuth } from '@/context/AuthContext';
import { useProjects } from '@/context/ProjectContext';
import { HexaButton } from './ui/hexa-button';
import { Input } from './ui/input';
import { Plus, Filter, LayoutGrid, Search, X, Tag, RefreshCw, Trash2 } from 'lucide-react';
import { allTags } from '@/data/mockData';
import { toast } from './ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Create a new ClearAllDialog component
interface ClearAllDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isClearing: boolean;
}

const ClearAllDialog = ({ isOpen, onClose, onConfirm, isClearing }: ClearAllDialogProps) => {
  const { currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    if (currentUser && currentUser.role === 'admin') {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [currentUser]);
  
  useEffect(() => {
    // Close the dialog if it's open but user is not admin
    if (isOpen && !isAdmin) {
      toast({
        title: "Authentication Required",
        description: "Only admins can clear all projects",
        variant: "destructive"
      });
      onClose();
    }
  }, [isOpen, isAdmin, onClose]);
  
  if (!isAdmin) return null;
  
  return (
    <DeleteConfirmationDialog
      project={{ 
        id: 'clear-all',
        title: 'ALL PROJECTS',
        description: 'This will clear all projects from the database.',
        coverImage: '/placeholder.svg',
        screenshots: ['/placeholder.svg'],
        demoUrl: 'https://example.com',
        category: 'System',
        tags: [],
        features: [],
        createdAt: new Date().toISOString()
      }}
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
};

const ProjectGallery = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isClearAllDialogOpen, setIsClearAllDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const { currentUser, isAuthenticated, checkAuthStatus } = useAuth();
  const { 
    filteredProjects, 
    addProject, 
    updateProject, 
    deleteProject,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedTags,
    toggleTagSelection,
    refreshProjects,
    isLoading,
    clearAllProjects // Use the new function
  } = useProjects();
  
  useEffect(() => {
    const checkAdminStatus = async () => {
      const isAuth = await checkAuthStatus();
      setIsAdmin(isAuth && currentUser?.role === 'admin');
    };
    
    checkAdminStatus();
  }, [currentUser, isAuthenticated, checkAuthStatus]);

  useEffect(() => {
    const initialCheck = async () => {
      await checkAuthStatus();
    };
    
    initialCheck();
  }, [checkAuthStatus]);

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleEditProject = useCallback(async (project: Project) => {
    try {
      const isAuth = await checkAuthStatus();
      if (!isAuth || currentUser?.role !== 'admin') {
        toast({
          title: "Permission Denied",
          description: "Only admins can edit projects",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedProject(project);
      setIsEditFormOpen(true);
    } catch (error) {
      console.error('Error in edit project:', error);
      toast({
        title: "Error",
        description: "Failed to open edit form. Please try again.",
        variant: "destructive"
      });
    }
  }, [checkAuthStatus, currentUser?.role]);

  const handleDeleteProject = useCallback(async (project: Project) => {
    try {
      const isAuth = await checkAuthStatus();
      if (!isAuth || currentUser?.role !== 'admin') {
        toast({
          title: "Permission Denied",
          description: "Only admins can delete projects",
          variant: "destructive"
        });
        return;
      }
      
      setProjectToDelete(project);
      setIsDeleteDialogOpen(true);
    } catch (error) {
      console.error('Error in delete project:', error);
      toast({
        title: "Error",
        description: "Failed to open delete dialog. Please try again.",
        variant: "destructive"
      });
    }
  }, [checkAuthStatus, currentUser?.role]);

  const handleClearAllProjects = async () => {
    try {
      const isAuth = await checkAuthStatus();
      if (!isAuth || currentUser?.role !== 'admin') {
        toast({
          title: "Permission Denied",
          description: "Only admins can clear all projects",
          variant: "destructive"
        });
        return;
      }
      
      setIsClearAllDialogOpen(true);
    } catch (error) {
      console.error('Error in clear all projects:', error);
      toast({
        title: "Error",
        description: "Failed to open clear all dialog. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleClearAllConfirm = async () => {
    try {
      setIsClearing(true);
      await clearAllProjects();
      setIsClearAllDialogOpen(false);
      
      toast({
        title: "Success",
        description: "All projects have been cleared",
      });
    } catch (error) {
      console.error('Error clearing all projects:', error);
      toast({
        title: "Error",
        description: "Failed to clear all projects. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsClearing(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleAddNewProject = async () => {
    try {
      const isAuth = await checkAuthStatus();
      if (!isAuth || currentUser?.role !== 'admin') {
        toast({
          title: "Permission Denied",
          description: "Only admins can add projects",
          variant: "destructive"
        });
        return;
      }
      
      setIsAddFormOpen(true);
    } catch (error) {
      console.error('Error in add project:', error);
      toast({
        title: "Error",
        description: "Failed to open add form. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleAddProject = async (projectData: Omit<Project, 'id' | 'createdAt'>) => {
    try {
      const isAuth = await checkAuthStatus();
      if (!isAuth || currentUser?.role !== 'admin') {
        toast({
          title: "Permission Denied",
          description: "Only admins can add projects",
          variant: "destructive"
        });
        return;
      }
      
      const newProject = await addProject(projectData);
      console.log("Project added successfully:", newProject);
      setIsAddFormOpen(false);
      
      toast({
        title: "Success",
        description: "Project added successfully",
      });
      
      await refreshProjects();
    } catch (error: any) {
      console.error('Error adding project:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add project. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateProject = async (updatedProject: Project) => {
    try {
      const isAuth = await checkAuthStatus();
      if (!isAuth || currentUser?.role !== 'admin') {
        toast({
          title: "Permission Denied",
          description: "Only admins can update projects",
          variant: "destructive"
        });
        return;
      }
      
      const result = await updateProject(updatedProject);
      console.log("Project updated successfully:", result);
      
      setIsEditFormOpen(false);
      
      if (selectedProject?.id === updatedProject.id) {
        setSelectedProject(result);
      }
      
      toast({
        title: "Success",
        description: "Project updated successfully",
      });
      
      await refreshProjects();
    } catch (error: any) {
      console.error('Error updating project:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update project. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteProjectConfirm = async (id: string) => {
    try {
      const isAuth = await checkAuthStatus();
      if (!isAuth || currentUser?.role !== 'admin') {
        toast({
          title: "Permission Denied",
          description: "Only admins can delete projects",
          variant: "destructive"
        });
        return;
      }
      
      await deleteProject(id);
      setIsDeleteDialogOpen(false);
      
      if (selectedProject?.id === id) {
        setIsModalOpen(false);
        setSelectedProject(null);
      }
      
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
      
      await refreshProjects();
    } catch (error: any) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete project. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshProjects();
      toast({
        title: "Refreshed",
        description: "Projects refreshed successfully",
      });
    } catch (error) {
      console.error('Error refreshing projects:', error);
      toast({
        title: "Error",
        description: "Failed to refresh projects",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const categories = Array.from(
    new Set(filteredProjects.map(p => p.category))
  );

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-hexa-red to-hexa-dark-red bg-clip-text text-transparent">
          Application & Website Gallery
        </h2>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gradient-to-r from-hexa-red/10 to-hexa-dark-red/10 px-3 py-1.5 rounded-full text-sm">
            <span className="w-2 h-2 rounded-full animate-hexa-pulse" 
                  style={{backgroundColor: isAuthenticated ? '#ea384c' : '#555555'}}></span>
            <span className="font-medium">
              {isAuthenticated ? (isAdmin ? 'Admin' : 'User') : 'Guest'} View
            </span>
          </div>
          
          <HexaButton 
            variant="outline" 
            size="sm" 
            className="gap-1" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </HexaButton>
          
          {isAdmin && (
            <>
              <HexaButton 
                variant="outline" 
                size="sm" 
                className="gap-1" 
                onClick={handleClearAllProjects}
                disabled={isClearing || filteredProjects.length === 0}
              >
                <Trash2 size={14} className="text-red-500" />
                <span className="text-red-500">Clear All</span>
              </HexaButton>
              
              <HexaButton variant="hexa" size="sm" className="gap-1" onClick={handleAddNewProject}>
                <Plus size={14} />
                <span>New Project</span>
              </HexaButton>
            </>
          )}
        </div>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input
            className="pl-10 pr-4 w-full"
            placeholder="Search projects by title, description or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setSearchQuery('')}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>
      
      <div className="mb-4 flex flex-wrap gap-2">
        <HexaButton 
          variant={selectedCategory === null ? "hexa" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => setSelectedCategory(null)}
        >
          <LayoutGrid size={14} className="mr-1" />
          All
        </HexaButton>
        
        {categories.map(category => (
          <HexaButton
            key={category}
            variant={selectedCategory === category ? "hexa" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => setSelectedCategory(category)}
          >
            <Filter size={14} className="mr-1" />
            {category}
          </HexaButton>
        ))}
      </div>
      
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Tag size={16} className="text-gray-500" />
          <span className="text-sm font-medium">Tags:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTagSelection(tag)}
              className={`px-2 py-1 text-xs rounded-full transition-all ${
                selectedTags.includes(tag)
                  ? 'bg-hexa-red text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center py-12">
          <RefreshCw size={40} className="mx-auto animate-spin text-gray-400" />
          <p className="mt-4 text-gray-500">Loading projects...</p>
        </div>
      ) : (
        <>
          {filteredProjects.length === 0 ? (
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg py-16 text-center">
              <div className="text-gray-400 mb-4">
                <LayoutGrid size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">No Projects Found</h3>
              <p className="text-gray-500 mb-6">
                {isAdmin 
                  ? "It seems there are no projects yet. Click the 'New Project' button to add one."
                  : "No projects found matching the selected filters."}
              </p>
              
              {isAdmin && (
                <HexaButton variant="hexa" size="sm" className="gap-2" onClick={handleAddNewProject}>
                  <Plus size={16} />
                  <span>Add New Project</span>
                </HexaButton>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  onClick={handleProjectClick}
                  onEdit={isAdmin ? handleEditProject : undefined}
                  onDelete={isAdmin ? handleDeleteProject : undefined}
                />
              ))}
            </div>
          )}
        </>
      )}
      
      <ProjectDetailsModal 
        project={selectedProject} 
        isOpen={isModalOpen} 
        onClose={closeModal}
        onEdit={isAdmin && selectedProject ? () => handleEditProject(selectedProject) : undefined}
      />
      
      {isAddFormOpen && (
        <ProjectForm
          isOpen={isAddFormOpen}
          onClose={() => setIsAddFormOpen(false)}
          onSubmit={handleAddProject}
          title="Add New Project"
        />
      )}
      
      {isEditFormOpen && selectedProject && (
        <ProjectForm
          isOpen={isEditFormOpen}
          onClose={() => setIsEditFormOpen(false)}
          onSubmit={handleUpdateProject}
          defaultValues={selectedProject}
          title="Edit Project"
        />
      )}
      
      <DeleteConfirmationDialog
        project={projectToDelete}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => projectToDelete && handleDeleteProjectConfirm(projectToDelete.id)}
      />
      
      <ClearAllDialog
        isOpen={isClearAllDialogOpen}
        onClose={() => setIsClearAllDialogOpen(false)}
        onConfirm={handleClearAllConfirm}
        isClearing={isClearing}
      />
    </div>
  );
};

export default ProjectGallery;
