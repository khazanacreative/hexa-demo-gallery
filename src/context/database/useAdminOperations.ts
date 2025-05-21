
import { useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase';
import { isUserAdmin } from '@/integrations/supabase/auth';
import { projects as initialProjects } from '@/data/mockData';

/**
 * Hook for admin-only project operations
 */
export function useAdminOperations(setProjects: React.Dispatch<React.SetStateAction<any[]>>) {
  /**
   * Clear all projects from the database (for admin use only)
   */
  const clearAllProjects = useCallback(async () => {
    try {
      // Check if user is admin
      const isAdmin = await isUserAdmin();
      if (!isAdmin) {
        toast({
          title: "Permission Denied",
          description: "Only admin users can clear all projects",
          variant: "destructive"
        });
        return false;
      }
      
      // Delete all projects from the database
      const { error } = await supabase
        .from('projects')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all projects
      
      if (error) {
        console.error("Error clearing projects:", error);
        throw error;
      }
      
      console.log("All projects cleared from database");
      
      // Clear local state
      setProjects([]);
      
      toast({
        title: "Success",
        description: "All projects have been cleared",
      });
      
      return true;
    } catch (error) {
      console.error("Error clearing projects:", error);
      toast({
        title: "Error",
        description: "Failed to clear projects",
        variant: "destructive"
      });
      return false;
    }
  }, [setProjects]);

  /**
   * Initialize database with mock data
   */
  const initializeWithMockData = useCallback(async () => {
    try {
      console.log("Initializing database with mock data");
      
      // Check if user is admin
      const isAdmin = await isUserAdmin();
      if (!isAdmin) {
        toast({
          title: "Permission Denied",
          description: "Only admin users can initialize with mock data",
          variant: "destructive"
        });
        return false;
      }
      
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
        return false;
      }
      
      if (refreshedData && refreshedData.length > 0) {
        const refreshedProjects = refreshedData.map(item => ({
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
      
      toast({
        title: "Success",
        description: "Initialized with mock data",
      });
      
      return true;
    } catch (error) {
      console.error("Error initializing with mock data:", error);
      toast({
        title: "Error",
        description: "Failed to initialize with mock data",
        variant: "destructive"
      });
      return false;
    }
  }, [setProjects]);

  /**
   * Helper for adding a project to the database
   */
  const addProjectToDb = useCallback(async (projectData) => {
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

  return {
    clearAllProjects,
    initializeWithMockData
  };
}
