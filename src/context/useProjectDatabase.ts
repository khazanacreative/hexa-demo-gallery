
import { useState, useCallback, useEffect } from 'react';
import { Project } from '@/types';
import { projects as initialProjects } from '@/data/mockData';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function useProjectDatabase() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("Fetching projects from database...");
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching projects:", error);
        throw error;
      }

      console.log("Projects fetched:", data);

      if (data && data.length > 0) {
        const dbProjects: Project[] = data.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description || '',
          coverImage: item.cover_image || '',
          screenshots: item.screenshots || [],
          demoUrl: item.demo_url || '',
          category: item.category || '',
          tags: item.tags || [],
          features: item.features || [],
          createdAt: item.created_at
        }));
        setProjects(dbProjects);
      } else {
        // Init with initial data if database empty
        console.log("No projects found, initializing with mock data...");
        const projectsWithUuids = initialProjects.map(p => ({
          ...p,
          id: crypto.randomUUID(),
          features: p.features || []
        }));
        setProjects(projectsWithUuids);

        console.log("Saving initial projects to database...");
        // Save initial projects to database
        for (const project of projectsWithUuids) {
          await supabase
            .from('projects')
            .insert({
              id: project.id,
              title: project.title,
              description: project.description,
              cover_image: project.coverImage,
              screenshots: project.screenshots,
              demo_url: project.demoUrl,
              category: project.category,
              tags: project.tags,
              features: project.features,
            });
        }
      }
    } catch (error) {
      console.error("Error in fetchProjects:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data project",
        variant: "destructive"
      });
      // Fallback to mock data
      const fallbackProjects = initialProjects.map(p => ({
        ...p,
        id: crypto.randomUUID(),
        features: p.features || []
      }));
      setProjects(fallbackProjects);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addProject = useCallback(async (projectData: Omit<Project, 'id' | 'createdAt'> | Project) => {
    try {
      console.log("Adding new project:", projectData);
      
      let newProject: Project;
      if ('id' in projectData && 'createdAt' in projectData) {
        newProject = projectData as Project;
      } else {
        newProject = {
          ...projectData as Omit<Project, 'id' | 'createdAt'>,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          features: (projectData as Omit<Project, 'id' | 'createdAt'>).features || []
        };
      }
      
      console.log("Prepared project for insertion:", newProject);
      
      const { data, error } = await supabase
        .from('projects')
        .insert({
          id: newProject.id,
          title: newProject.title,
          description: newProject.description,
          cover_image: newProject.coverImage,
          screenshots: newProject.screenshots,
          demo_url: newProject.demoUrl,
          category: newProject.category,
          tags: newProject.tags,
          features: newProject.features
        })
        .select()
        .single();
        
      if (error) {
        console.error("Error adding project to database:", error);
        throw error;
      }

      console.log("Project added to database:", data);

      const addedProject: Project = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        coverImage: data.cover_image || '',
        screenshots: data.screenshots || [],
        demoUrl: data.demo_url || '',
        category: data.category || '',
        tags: data.tags || [],
        features: data.features || [],
        createdAt: data.created_at
      };

      setProjects(prev => [addedProject, ...prev]);
      toast({
        title: "Project added",
        description: `${newProject.title} has been added successfully.`,
      });
      
      return addedProject;
    } catch (error) {
      console.error("Error adding project:", error);
      toast({
        title: "Error",
        description: "Gagal menambahkan project. Silakan coba lagi.",
        variant: "destructive"
      });
      throw error;
    }
  }, []);

  const updateProject = useCallback(async (updatedProject: Project) => {
    try {
      console.log("Updating project:", updatedProject);
      
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
          features: updatedProject.features,
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedProject.id);

      if (error) {
        console.error("Error updating project in database:", error);
        throw error;
      }
      
      // Trigger a full refresh to ensure data consistency
      await fetchProjects();
      
      // Get the updated project from the refreshed state
      const updatedProjectFromState = projects.find(p => p.id === updatedProject.id);
      
      if (!updatedProjectFromState) {
        console.error("Updated project not found in refreshed state");
        toast({
          title: "Error",
          description: "Gagal memperbarui data project. Silakan refresh halaman.",
          variant: "destructive"
        });
        throw new Error("Project not found after update");
      }

      toast({
        title: "Project updated",
        description: `${updatedProject.title} has been updated successfully.`,
      });
      
      return updatedProjectFromState;
    } catch (error) {
      console.error("Error updating project:", error);
      toast({
        title: "Error",
        description: "Gagal memperbarui project. Silakan coba lagi.",
        variant: "destructive"
      });
      throw error;
    }
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    try {
      console.log("Deleting project:", id);
      const projectToDelete = projects.find(p => p.id === id);
      
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error("Error deleting project from database:", error);
        throw error;
      }

      console.log("Project deleted from database");
      setProjects(prev => prev.filter(p => p.id !== id));
      
      toast({
        title: "Project deleted",
        description: `${projectToDelete?.title || "Project"} has been deleted.`,
        variant: "destructive",
      });
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus project. Silakan coba lagi.",
        variant: "destructive"
      });
      throw error;
    }
  }, [projects]);

  const refreshProjects = useCallback(async () => {
    console.log("Manually refreshing projects...");
    await fetchProjects();
  }, [fetchProjects]);

  // Set up realtime subscription to projects table
  useEffect(() => {
    console.log("Setting up initial data fetch and realtime subscription...");
    fetchProjects();
    
    console.log("Creating realtime channel subscription...");
    const channel = supabase
      .channel('projects-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'projects' 
        }, 
        payload => {
          console.log('Realtime change received:', payload);
          
          // Handle different database events
          if (payload.eventType === 'INSERT') {
            const newProject = payload.new;
            console.log('INSERT event detected:', newProject);
            
            // Only add if not already in the list
            setProjects(current => {
              if (current.some(p => p.id === newProject.id)) {
                console.log('Project already exists in state, skipping');
                return current;
              }
              
              console.log('Adding new project to state');
              const formattedProject: Project = {
                id: newProject.id,
                title: newProject.title,
                description: newProject.description || '',
                coverImage: newProject.cover_image || '',
                screenshots: newProject.screenshots || [],
                demoUrl: newProject.demo_url || '',
                category: newProject.category || '',
                tags: newProject.tags || [],
                features: newProject.features || [],
                createdAt: newProject.created_at
              };
              
              return [formattedProject, ...current];
            });
          }
          
          else if (payload.eventType === 'UPDATE') {
            const updatedProject = payload.new;
            console.log('UPDATE event detected:', updatedProject);
            
            // Trigger a full refresh to ensure data consistency
            fetchProjects().catch(error => {
              console.error('Error refreshing projects after update:', error);
              // If refresh fails, update state directly
              setProjects(current => 
                current.map(p => {
                  if (p.id === updatedProject.id) {
                    console.log('Updating project in state:', p.id);
                    return {
                      id: updatedProject.id,
                      title: updatedProject.title,
                      description: updatedProject.description || '',
                      coverImage: updatedProject.cover_image || '',
                      screenshots: updatedProject.screenshots || [],
                      demoUrl: updatedProject.demo_url || '',
                      category: updatedProject.category || '',
                      tags: updatedProject.tags || [],
                      features: updatedProject.features || [],
                      createdAt: updatedProject.created_at
                    };
                  }
                  return p;
                })
              );
            });
          }
          
          else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            console.log('DELETE event detected:', deletedId);
            
            setProjects(current => {
              const filtered = current.filter(p => p.id !== deletedId);
              console.log(`Removed project ${deletedId} from state, ${current.length} → ${filtered.length} projects`);
              return filtered;
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });
    
    // Cleanup subscription on unmount
    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [fetchProjects]);

  return {
    projects, setProjects,
    isLoading, setIsLoading,
    fetchProjects,
    addProject,
    updateProject,
    deleteProject,
    refreshProjects,
  };
}
