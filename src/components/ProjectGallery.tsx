
import { useState } from 'react';
import { Project } from '@/types';
import ProjectCard from './ProjectCard';
import ProjectDetailsModal from './ProjectDetailsModal';
import { useAuth } from '@/context/AuthContext';
import { Button } from './ui/button';
import { MorphButton } from './ui/morph-button';
import { Plus, Filter, LayoutGrid } from 'lucide-react';

interface ProjectGalleryProps {
  projects: Project[];
}

const ProjectGallery = ({ projects }: ProjectGalleryProps) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filteredCategory, setFilteredCategory] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const isAdmin = currentUser.role === 'admin';

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleEditProject = (project: Project) => {
    // In a real application, this would open an edit form
    alert(`Admin would edit project: ${project.title}`);
  };

  const handleDeleteProject = (project: Project) => {
    // In a real application, this would show a confirmation dialog
    alert(`Admin would delete project: ${project.title}`);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Get unique categories
  const categories = Array.from(new Set(projects.map(p => p.category)));
  
  // Filter projects if a category is selected
  const displayedProjects = filteredCategory 
    ? projects.filter(p => p.category === filteredCategory)
    : projects;

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-morph-purple to-morph-blue bg-clip-text text-transparent">
          Application & Website Gallery
        </h2>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gradient-to-r from-morph-purple/10 to-morph-blue/10 px-3 py-1.5 rounded-full text-sm">
            <span className="w-2 h-2 rounded-full animate-morph-pulse" 
                  style={{backgroundColor: currentUser.role === 'admin' ? '#8B5CF6' : '#0EA5E9'}}></span>
            <span className="font-medium">
              {currentUser.role === 'admin' ? 'Admin' : 'User'} View
            </span>
          </div>
          
          {isAdmin && (
            <MorphButton variant="morph" size="sm" className="gap-1">
              <Plus size={14} />
              <span>New Project</span>
            </MorphButton>
          )}
        </div>
      </div>
      
      <div className="mb-6 flex flex-wrap gap-2">
        <Button 
          variant={filteredCategory === null ? "default" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => setFilteredCategory(null)}
        >
          <LayoutGrid size={14} className="mr-1" />
          All
        </Button>
        {categories.map(category => (
          <Button
            key={category}
            variant={filteredCategory === category ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => setFilteredCategory(category)}
          >
            <Filter size={14} className="mr-1" />
            {category}
          </Button>
        ))}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedProjects.map((project) => (
          <ProjectCard 
            key={project.id} 
            project={project} 
            onClick={handleProjectClick}
            onEdit={isAdmin ? handleEditProject : undefined}
            onDelete={isAdmin ? handleDeleteProject : undefined}
          />
        ))}
      </div>
      
      {displayedProjects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No projects found matching the selected filter.</p>
        </div>
      )}

      <ProjectDetailsModal 
        project={selectedProject} 
        isOpen={isModalOpen} 
        onClose={closeModal} 
      />
    </div>
  );
};

export default ProjectGallery;
