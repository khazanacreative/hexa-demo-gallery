
import { Project } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ExternalLink, ChevronLeft, ChevronRight, Star, MessageSquare, Share2, Edit } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MorphButton } from './ui/morph-button';
import { Separator } from './ui/separator';

interface ProjectDetailsModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProjectDetailsModal = ({ project, isOpen, onClose }: ProjectDetailsModalProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { currentUser } = useAuth();
  const isAdmin = currentUser.role === 'admin';

  if (!project) return null;

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === project.screenshots.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? project.screenshots.length - 1 : prev - 1
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[90vw] p-0 overflow-hidden rounded-xl">
        <div className="bg-gradient-to-r from-morph-purple/10 to-morph-blue/10 p-6">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold">{project.title}</DialogTitle>
              {isAdmin && (
                <span className="bg-gradient-to-r from-morph-purple to-morph-blue text-white text-xs px-3 py-1 rounded-full">
                  Admin View
                </span>
              )}
            </div>
            <DialogDescription className="text-gray-500 flex items-center gap-1">
              <span className="bg-gray-200 text-gray-800 px-2 py-0.5 rounded text-xs font-medium">{project.category}</span>
              <span>•</span>
              <span>{new Date(project.createdAt).toLocaleDateString()}</span>
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6">
          <div className="relative aspect-video bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg overflow-hidden mb-6">
            <img 
              src={project.screenshots[currentImageIndex]} 
              alt={`Screenshot ${currentImageIndex + 1}`}
              className="w-full h-full object-contain"
            />
            
            {project.screenshots.length > 1 && (
              <>
                <MorphButton 
                  variant="ghost" 
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-9 h-9"
                  onClick={prevImage}
                >
                  <ChevronLeft size={18} />
                </MorphButton>
                <MorphButton 
                  variant="ghost" 
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-9 h-9"
                  onClick={nextImage}
                >
                  <ChevronRight size={18} />
                </MorphButton>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {project.screenshots.map((_, i) => (
                    <button 
                      key={i}
                      className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                        i === currentImageIndex ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'
                      }`}
                      onClick={() => setCurrentImageIndex(i)}
                      aria-label={`View screenshot ${i+1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <h3 className="text-lg font-semibold mb-2">Description</h3>
          <p className="text-gray-700 mb-6">{project.description}</p>

          <div className="flex flex-wrap gap-3 items-center justify-between mt-6">
            <div className="flex gap-2">
              <MorphButton variant="outline" size="sm" className="gap-1">
                <Star size={14} />
                <span>Favorite</span>
              </MorphButton>
              
              {isAdmin && (
                <MorphButton variant="outline" size="sm" className="gap-1">
                  <Edit size={14} />
                  <span>Edit Details</span>
                </MorphButton>
              )}
            </div>

            <MorphButton 
              variant="morph" 
              className="gap-2"
              asChild
            >
              <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={16} />
                <span>Visit Demo</span>
              </a>
            </MorphButton>
          </div>
          
          {isAdmin && (
            <>
              <Separator className="my-5" />
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                  <span className="w-2 h-2 bg-morph-purple rounded-full"></span>
                  Admin Analytics
                </h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-white p-2 rounded border border-gray-100">
                    <p className="text-xs text-gray-500">Views</p>
                    <p className="font-semibold">1,452</p>
                  </div>
                  <div className="bg-white p-2 rounded border border-gray-100">
                    <p className="text-xs text-gray-500">Demo Clicks</p>
                    <p className="font-semibold">287</p>
                  </div>
                  <div className="bg-white p-2 rounded border border-gray-100">
                    <p className="text-xs text-gray-500">Favorites</p>
                    <p className="font-semibold">64</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectDetailsModal;
