import { useState } from 'react';
import { Project } from '@/types';
import ProjectCard from './ProjectCard';
import ProjectDetailsModal from './ProjectDetailsModal';
import ProjectForm from './ProjectForm';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import { useAuth } from '@/context/AuthContext';
import { useProjects } from '@/context/ProjectContext';
import { HexaButton } from './ui/hexa-button';
import { Input } from './ui/input';
import { Plus, Filter, LayoutGrid, Search, X, Tag } from 'lucide-react';
import { allTags } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from './ui/use-toast';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const ProjectGallery = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const { currentUser } = useAuth();
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
    refreshProjects
  } = useProjects();
  
  const isAdmin = currentUser?.role === 'admin';

  // Pagination logic
  const ITEMS_PER_PAGE = 9;
  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedProjects = filteredProjects.slice(startIndex, endIndex);

  // Reset to first page when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setIsEditFormOpen(true);
  };

  const handleDeleteProject = (project: Project) => {
    setProjectToDelete(project);
    setIsDeleteDialogOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleAddNewProject = () => {
    setIsAddFormOpen(true);
  };

  // Helper function to map local user IDs to database UUIDs
  const getUserUUID = (userId: string): string => {
    // Map local user IDs to the UUIDs we inserted in the database
    const userMapping = {
      '1': 'c07e6ba2-a252-4f7c-a0f8-0ac7dbe433d5', // admin user
      '2': 'ef13c84c-195d-44ca-bf4a-8166500f1b3c', // regular user
    };
    
    return userMapping[userId as keyof typeof userMapping] || userId;
  };

  const handleAddProject = async (projectData: Omit<Project, 'id' | 'createdAt'>) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      console.log('Adding project:', projectData);
      console.log('Current user:', currentUser);
      
      // Check if the user is logged in
      if (!currentUser?.id) {
        throw new Error('You must be logged in to add a project');
      }

      // Map the user ID to the database UUID
      const userUUID = getUserUUID(currentUser.id);
      console.log('Mapped user UUID:', userUUID);

      const { data, error } = await supabase
        .from('projects')
        .insert({
          title: projectData.title,
          description: projectData.description || '',
          cover_image: projectData.coverImage,
          screenshots: projectData.screenshots,
          demo_url: projectData.demoUrl,
          category: projectData.category,
          tags: projectData.tags,
          features: projectData.features,
          user_id: userUUID
        })
        .select();

      if (error) {
        console.error('Error details:', error);
        throw error;
      }

      if (data && data[0]) {
        const newProject: Project = {
          id: data[0].id,
          title: data[0].title,
          description: data[0].description || '',
          coverImage: data[0].cover_image || '',
          screenshots: data[0].screenshots || [],
          demoUrl: data[0].demo_url || '',
          category: data[0].category || '',
          tags: data[0].tags || [],
          features: data[0].features || [],
          createdAt: data[0].created_at
        };

        addProject(newProject);
        toast({
          title: "Project berhasil ditambahkan",
          description: `${newProject.title} telah berhasil ditambahkan.`,
        });
      }
    } catch (error) {
      console.error('Error adding project:', error);
      toast({
        title: "Error",
        description: "Gagal menambahkan project. Silakan coba lagi.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
      setIsAddFormOpen(false);
      // Refresh projects to ensure data consistency
      refreshProjects();
    }
  };

  const handleUpdateProject = async (updatedProject: Project) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      console.log('Updating project with ID:', updatedProject.id);
      console.log('Current user:', currentUser);

      const { error } = await supabase
        .from('projects')
        .update({
          title: updatedProject.title,
          description: updatedProject.description,
          cover_image: updatedProject.coverImage,
          screenshots: updatedProject.screenshots,
          demo_url: updatedProject.demoUrl,
          category: updatedProject.category,
          tags: updatedProject.tags,
          features: updatedProject.features
        })
        .eq('id', updatedProject.id);

      if (error) {
        console.error('Update error details:', error);
        throw error;
      }

      updateProject(updatedProject);
      toast({
        title: "Project berhasil diupdate",
        description: `${updatedProject.title} telah berhasil diupdate.`,
      });

    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: "Error",
        description: "Gagal mengupdate project. Silakan coba lagi.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
      setIsEditFormOpen(false);
      // Refresh projects to ensure data consistency
      refreshProjects();
    }
  };

  const handleDeleteProjectConfirm = async () => {
    if (!projectToDelete || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      console.log('Deleting project with ID:', projectToDelete.id);
      console.log('Current user:', currentUser);

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectToDelete.id);

      if (error) {
        console.error('Delete error details:', error);
        throw error;
      }

      deleteProject(projectToDelete.id);
      toast({
        title: "Project berhasil dihapus",
        description: "Project telah berhasil dihapus.",
      });
      
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus project. Silakan coba lagi.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
      setIsDeleteDialogOpen(false);
      // Refresh projects to ensure data consistency
      refreshProjects();
    }
  };

  // Fixed categories that should always appear, now including UI Design
  const fixedCategories = ['Website', 'Web App', 'Mobile App', 'UI Design'];
  
  // Get additional categories from projects that aren't in the fixed list
  const additionalCategories = Array.from(
    new Set(filteredProjects.map(p => p.category).filter(category => 
      category && !fixedCategories.includes(category)
    ))
  );
  
  // Combine fixed categories with additional ones
  const allCategories = [...fixedCategories, ...additionalCategories];

  // Simplified category and tag filtering for basic functionality
  const categories = Array.from(
    new Set(filteredProjects.map(p => p.category).filter(Boolean))
  );

  // Use all available tags from allTags array
  const visibleTags = allTags.filter(tag =>
    filteredProjects.some(project => project.tags.includes(tag))
  );

  // Custom search handler that resets pagination
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    handleFilterChange();
  };

  // Custom category handler that resets pagination
  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
    handleFilterChange();
  };

  // Custom tag handler that resets pagination
  const handleTagToggle = (tag: string) => {
    toggleTagSelection(tag);
    handleFilterChange();
  };

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-hexa-red to-hexa-dark-red bg-clip-text text-transparent">
          Application & Website Gallery
        </h2>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gradient-to-r from-hexa-red/10 to-hexa-dark-red/10 px-3 py-1.5 rounded-full text-sm">
            <span className="w-2 h-2 rounded-full animate-hexa-pulse" 
                  style={{backgroundColor: isAdmin ? '#ea384c' : '#555555'}}></span>
            <span className="font-medium">
              {isAdmin ? 'Admin' : 'User'} View
            </span>
          </div>
          
          {isAdmin && (
            <HexaButton 
              variant="hexa" 
              size="sm" 
              className="gap-1" 
              onClick={handleAddNewProject} 
              disabled={isSubmitting}
            >
              <Plus size={14} />
              <span>New Project</span>
            </HexaButton>
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
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => handleSearchChange('')}
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
          onClick={() => handleCategoryChange(null)}
        >
          <LayoutGrid size={14} className="mr-1" />
          All
        </HexaButton>
        
        {allCategories.map(category => (
          <HexaButton
            key={category}
            variant={selectedCategory === category ? "hexa" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => handleCategoryChange(category)}
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
          {visibleTags.map(tag => (
            <button
              key={tag}
              onClick={() => handleTagToggle(tag)}
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

      {/* Pagination info */}
      <div className="mb-4 text-sm text-gray-600 text-center">
        Showing {startIndex + 1}-{Math.min(endIndex, filteredProjects.length)} of {filteredProjects.length} projects
        {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {paginatedProjects.map((project) => (
          <ProjectCard 
            key={project.id} 
            project={project} 
            onClick={handleProjectClick}
            onEdit={isAdmin ? handleEditProject : undefined}
            onDelete={isAdmin ? handleDeleteProject : undefined}
          />
        ))}
      </div>
      
      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No projects found matching the selected filters.</p>
        </div>
      )}

      {/* Pagination Component */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) {
                      setCurrentPage(currentPage - 1);
                    }
                  }}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {/* First page */}
              {currentPage > 3 && (
                <>
                  <PaginationItem>
                    <PaginationLink 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(1);
                      }}
                      className="cursor-pointer"
                    >
                      1
                    </PaginationLink>
                  </PaginationItem>
                  {currentPage > 4 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                </>
              )}

              {/* Current page and surrounding pages */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => 
                  page === currentPage || 
                  page === currentPage - 1 || 
                  page === currentPage + 1 ||
                  (currentPage <= 2 && page <= 3) ||
                  (currentPage >= totalPages - 1 && page >= totalPages - 2)
                )
                .map(page => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(page);
                      }}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))
              }

              {/* Last page */}
              {currentPage < totalPages - 2 && (
                <>
                  {currentPage < totalPages - 3 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    <PaginationLink 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(totalPages);
                      }}
                      className="cursor-pointer"
                    >
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}
              
              <PaginationItem>
                <PaginationNext 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) {
                      setCurrentPage(currentPage + 1);
                    }
                  }}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
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
        onConfirm={handleDeleteProjectConfirm}
      />
    </div>
  );
};

export default ProjectGallery;
