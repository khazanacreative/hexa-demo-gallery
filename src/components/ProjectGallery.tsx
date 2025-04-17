
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

const ProjectGallery = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  
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
    toggleTagSelection
  } = useProjects();
  
  const isAdmin = currentUser.role === 'admin';

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

  // Extract unique categories
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
                  style={{backgroundColor: currentUser.role === 'admin' ? '#ea384c' : '#555555'}}></span>
            <span className="font-medium">
              {currentUser.role === 'admin' ? 'Admin' : 'User'} View
            </span>
          </div>
          
          {isAdmin && (
            <HexaButton variant="hexa" size="sm" className="gap-1" onClick={handleAddNewProject}>
              <Plus size={14} />
              <span>New Project</span>
            </HexaButton>
          )}
        </div>
      </div>
      
      {/* Search Bar */}
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
      
      {/* Category Filters */}
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
      
      {/* Tag Filters */}
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
      
      {/* Project Grid */}
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
      
      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No projects found matching the selected filters.</p>
        </div>
      )}

      {/* Project Details Modal */}
      <ProjectDetailsModal 
        project={selectedProject} 
        isOpen={isModalOpen} 
        onClose={closeModal} 
      />
      
      {/* Add Project Form */}
      {isAddFormOpen && (
        <ProjectForm
          isOpen={isAddFormOpen}
          onClose={() => setIsAddFormOpen(false)}
          onSubmit={addProject}
          title="Add New Project"
        />
      )}
      
      {/* Edit Project Form */}
      {isEditFormOpen && selectedProject && (
        <ProjectForm
          isOpen={isEditFormOpen}
          onClose={() => setIsEditFormOpen(false)}
          onSubmit={(data) => updateProject({ ...data, id: selectedProject.id, createdAt: selectedProject.createdAt })}
          defaultValues={selectedProject}
          title="Edit Project"
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        project={projectToDelete}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => projectToDelete && deleteProject(projectToDelete.id)}
      />
    </div>
  );
};

export default ProjectGallery;
