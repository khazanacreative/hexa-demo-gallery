
import { useState, useCallback, useEffect } from 'react';
import { Project } from '@/types';
import { projects as initialProjects } from '@/data/mockData';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to manage project data with Supabase integration
 */
export function useProjectDatabase() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  /**
   * Check if user is authenticated
   */
  const checkAuthentication = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const hasSession = !!data.session;
    setIsAuthenticated(hasSession);
    return hasSession;
  }, []);

  /**
   * Fetch all projects from the database
   */
  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("Fetching projects from database...");
      
      // Check authentication status
      const hasSession = await checkAuthentication();
      
      // Fetch projects from database
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching projects:", error);
        throw error;
      }

      console.log("Projects fetched:", data);

      // If we have projects in the database, use them
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
        // If no data and authenticated, initialize with mock data
        if (hasSession) {
          console.log("No projects found, initializing with mock data...");
          await initializeWithMockData();
        } else {
          // If not authenticated, use mock data but don't save to database
          console.log("User not authenticated, using mock data without saving to database");
          const projectsWithUuids = initialProjects.map(p => ({
            ...p,
            id: crypto.randomUUID(),
            features: p.features || []
          }));
          setProjects(projectsWithUuids);
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
  }, [checkAuthentication]);

  /**
   * Initialize database with mock data
   */
  const initializeWithMockData = useCallback(async () => {
    try {
      console.log("Initializing database with mock data");
      
      const projectsWithUuids = initialProjects.map(p => ({
        ...p,
        id: crypto.randomUUID(),
        features: p.features || []
      }));
      
      // Save all mock projects to database
      for (const project of projectsWithUuids) {
        await addProjectToDb({
          title: project.title,
          description: project.description,
          coverImage: project.coverImage,
          screenshots: project.screenshots,
          demoUrl: project.demoUrl,
          category: project.category,
          tags: project.tags,
          features: project.features,
        });
      }
      
      // Fetch the saved projects with server-generated IDs
      const { data: refreshedData, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Error fetching refreshed projects:", error);
        return;
      }
      
      if (refreshedData && refreshedData.length > 0) {
        const refreshedProjects: Project[] = refreshedData.map(item => ({
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
        setProjects(refreshedProjects);
      } else {
        // If no refreshed data, use the original mock data
        setProjects(projectsWithUuids);
      }
    } catch (error) {
      console.error("Error initializing with mock data:", error);
      throw error;
    }
  }, []);

  /**
   * Add a new project to the database
   */
  const addProjectToDb = useCallback(async (projectData: Omit<Project, 'id' | 'createdAt'>) => {
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('User not authenticated');
    }

    // Create a new project object with proper field names for Supabase
    const newProject = {
      title: projectData.title,
      description: projectData.description,
      cover_image: projectData.coverImage,
      screenshots: projectData.screenshots,
      demo_url: projectData.demoUrl,
      category: projectData.category,
      tags: projectData.tags,
      features: projectData.features,
      user_id: session.user.id
    };
    
    console.log("Prepared project for insertion:", newProject);
    
    // Insert into database
    const { data, error } = await supabase
      .from('projects')
      .insert([newProject])
      .select()
      .single();
      
    if (error) {
      console.error("Error adding project to database:", error);
      throw error;
    }

    return data;
  }, []);

  /**
   * Add a new project to the state and database
   */
  const addProject = useCallback(async (projectData: Omit<Project, 'id' | 'createdAt'> | Project) => {
    try {
      console.log("Adding new project:", projectData);
      
      // Check authentication
      const isAuth = await checkAuthentication();
      if (!isAuth) {
        throw new Error('User not authenticated');
      }
      
      let data;
      
      // If it's already a Project type (has id and createdAt)
      if ('id' in projectData && 'createdAt' in projectData) {
        data = await addProjectToDb({
          title: projectData.title,
          description: projectData.description,
          coverImage: projectData.coverImage,
          screenshots: projectData.screenshots,
          demoUrl: projectData.demoUrl,
          category: projectData.category,
          tags: projectData.tags,
          features: projectData.features || []
        });
      } else {
        // It's just project data without ID
        data = await addProjectToDb(projectData);
      }

      console.log("Project added to database:", data);

      // Convert response to Project type
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

      // Update local state
      setProjects(prev => [addedProject, ...prev]);
      
      toast({
        title: "Project added",
        description: `${addedProject.title} has been added successfully.`,
      });
      
      return addedProject;
    } catch (error: any) {
      console.error("Error adding project:", error);
      toast({
        title: "Error",
        description: `Gagal menambahkan project: ${error.message}`,
        variant: "destructive"
      });
      throw error;
    }
  }, [checkAuthentication, addProjectToDb]);

  /**
   * Update an existing project in the database
   */
  const updateProject = useCallback(async (updatedProject: Project) => {
    try {
      console.log("Updating project:", updatedProject);
      
      // Check authentication
      const isAuth = await checkAuthentication();
      if (!isAuth) {
        throw new Error('User not authenticated');
      }

      // Update in database with properly formatted data
      const { data, error } = await supabase
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
        .eq('id', updatedProject.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating project in database:", error);
        throw error;
      }

      if (!data) {
        throw new Error("No data returned after update");
      }

      console.log("Project updated in database:", data);
      
      // Convert response to Project type
      const updatedProjectFromDB: Project = {
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

      // Update local state immediately
      setProjects(prev => prev.map(p => 
        p.id === updatedProjectFromDB.id ? updatedProjectFromDB : p
      ));

      toast({
        title: "Project updated",
        description: `${updatedProject.title} telah berhasil diperbarui.`,
      });
      
      return updatedProjectFromDB;
    } catch (error: any) {
      console.error("Error updating project:", error);
      toast({
        title: "Error",
        description: `Gagal memperbarui project: ${error.message}`,
        variant: "destructive"
      });
      throw error;
    }
  }, [checkAuthentication]);

  /**
   * Delete a project from the database
   */
  const deleteProject = useCallback(async (id: string) => {
    try {
      console.log("Deleting project:", id);
      
      // Find the project to be deleted (for toast message)
      const projectToDelete = projects.find(p => p.id === id);
      
      // Check authentication
      const isAuth = await checkAuthentication();
      if (!isAuth) {
        throw new Error('User not authenticated');
      }

      // Delete from database
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error("Error deleting project from database:", error);
        throw error;
      }

      console.log("Project deleted from database");
      
      // Update local state immediately
      setProjects(prev => prev.filter(p => p.id !== id));
      
      toast({
        title: "Project deleted",
        description: `${projectToDelete?.title || "Project"} has been deleted.`,
      });
    } catch (error: any) {
      console.error("Error deleting project:", error);
      toast({
        title: "Error",
        description: `Gagal menghapus project: ${error.message}`,
        variant: "destructive"
      });
      throw error;
    }
  }, [projects, checkAuthentication]);

  /**
   * Manually refresh projects from the database
   */
  const refreshProjects = useCallback(async () => {
    console.log("Manually refreshing projects...");
    await fetchProjects();
    toast({
      title: "Refreshed",
      description: "Data project telah diperbarui dari database.",
    });
  }, [fetchProjects]);

  // Set up initial data fetch and realtime subscription
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
        async payload => {
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
            
            // Update state directly without full refresh
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
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to realtime changes');
        }
      });
    
    // Cleanup subscription on unmount
    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [fetchProjects]);

  // Return the project database API
  return {
    projects, 
    setProjects,
    isLoading, 
    setIsLoading,
    fetchProjects,
    addProject,
    updateProject,
    deleteProject,
    refreshProjects,
    isAuthenticated,
  };
}
