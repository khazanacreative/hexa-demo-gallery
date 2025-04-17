
import { Project } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { HexaButton } from './ui/hexa-button';
import ProjectAdminControls from './ProjectAdminControls';

interface ProjectCardProps {
  project: Project;
  onClick: (project: Project) => void;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
}

const ProjectCard = ({ project, onClick, onEdit, onDelete }: ProjectCardProps) => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser.role === 'admin';

  return (
    <Card className="overflow-hidden transition-all duration-300 border border-gray-200 hover:border-hexa-red h-full flex flex-col shadow-sm hover:shadow-hexa animate-scale-in">
      <div 
        className="h-48 overflow-hidden relative group cursor-pointer"
        onClick={() => onClick(project)}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40 z-10"></div>
        <img 
          src={project.coverImage} 
          alt={project.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
        />
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-20">
          <div className="inline-block bg-gradient-to-r from-hexa-red to-hexa-dark-red text-xs font-semibold px-2 py-1 rounded-md mb-1">
            {project.category}
          </div>
        </div>
        
        <ProjectAdminControls 
          project={project} 
          onEdit={onEdit} 
          onDelete={onDelete} 
        />
      </div>
      
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold line-clamp-1">{project.title}</CardTitle>
        <CardDescription className="text-sm text-gray-500">
          {new Date(project.createdAt).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-4 flex-grow">
        <p className="text-sm line-clamp-3">{project.description}</p>
        
        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {project.tags.slice(0, 3).map(tag => (
              <span key={tag} className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
            {project.tags.length > 3 && (
              <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                +{project.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0 flex justify-between items-center">
        <HexaButton 
          variant="hexaOutline" 
          size="sm" 
          className="gap-1 text-xs"
          onClick={() => onClick(project)}
        >
          <ImageIcon size={14} />
          <span>{project.screenshots.length} Screenshots</span>
        </HexaButton>
        
        <HexaButton 
          variant="hexa" 
          size="sm" 
          className="gap-1"
          asChild
        >
          <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={14} />
            <span>Demo</span>
          </a>
        </HexaButton>
      </CardFooter>
      
      {isAdmin && (
        <div className="absolute top-0 left-0 bg-black/70 text-white text-xs px-2 py-1 m-2 rounded">
          Admin View
        </div>
      )}
    </Card>
  );
};

export default ProjectCard;
