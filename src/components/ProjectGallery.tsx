
import React, { useState, useEffect } from 'react';
import { useProjects } from '@/context/ProjectContext';
import { useAuth } from '@/context/AuthContext';
import ProjectCard from './ProjectCard';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter } from 'lucide-react';
import { allTags } from '@/data/mockData';

const ProjectGallery = () => {
  const { projects, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, selectedTags, toggleTagSelection, isLoading } = useProjects();
  const { currentUser } = useAuth();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('overflow-hidden', isFilterOpen);
    return () => document.body.classList.remove('overflow-hidden');
  }, [isFilterOpen]);

  const getAvailableTags = () => {
    if (!currentUser?.categoryPermissions) {
      return allTags.webApp.concat(allTags.mobileApp);
    }
    
    let availableTags: string[] = [];
    currentUser.categoryPermissions.forEach(permission => {
      switch (permission) {
        case 'web-app':
          availableTags = availableTags.concat(allTags.webApp);
          break;
        case 'mobile-app':
          availableTags = availableTags.concat(allTags.mobileApp);
          break;
        case 'website':
          availableTags = availableTags.concat(allTags.website);
          break;
      }
    });
    
    return [...new Set(availableTags)];
  };

  const availableTags = getAvailableTags();

  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  const handleCategoryClick = (category: string | null) => {
    setSelectedCategory(category);
    setIsFilterOpen(false);
  };

  const handleProjectClick = (project: any) => {
    // Handle project click - you can implement project details modal here
    console.log('Project clicked:', project);
  };

  return (
    <div className="relative">
      {/* Search Bar */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-gray-50 to-gray-100 p-4">
        <div className="flex items-center space-x-2">
          <div className="relative flex-grow">
            <Input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-full pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          </div>
          <button
            onClick={toggleFilter}
            className="bg-secondary text-foreground p-2 rounded-full hover:bg-accent transition-colors"
          >
            <Filter className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Filter Modal */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-20 overflow-y-auto bg-black bg-opacity-50">
          <div className="flex min-h-screen items-center justify-center">
            <div className="relative bg-white rounded-xl shadow-lg max-w-md w-full mx-4 p-6">
              <button
                onClick={toggleFilter}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <h2 className="text-lg font-semibold mb-4">Filter Projects</h2>

              {/* Category Filters */}
              <div className="mb-4">
                <h3 className="text-md font-semibold mb-2">Categories</h3>
                <Badge
                  onClick={() => handleCategoryClick(null)}
                  className={`cursor-pointer mr-2 mb-2 ${selectedCategory === null ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
                    }`}
                >
                  All
                </Badge>
                {(['Web App', 'Mobile App', 'Website']).map((category) => (
                  <Badge
                    key={category}
                    onClick={() => handleCategoryClick(category)}
                    className={`cursor-pointer mr-2 mb-2 ${selectedCategory === category ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
                      }`}
                  >
                    {category}
                  </Badge>
                ))}
              </div>

              {/* Tag Filters */}
              <div>
                <h3 className="text-md font-semibold mb-2">Tags</h3>
                <div className="flex flex-wrap">
                  {availableTags.map((tag) => (
                    <Badge
                      key={tag}
                      onClick={() => toggleTagSelection(tag)}
                      className={`cursor-pointer mr-2 mb-2 ${selectedTags.includes(tag) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
                        }`}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <p>Loading projects...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {projects.map((project) => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              onClick={handleProjectClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectGallery;
