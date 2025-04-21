
import { useState, useCallback } from 'react';
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
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
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
        const projectsWithUuids = initialProjects.map(p => ({
          ...p,
          id: crypto.randomUUID(),
          features: p.features || []
        }));
        setProjects(projectsWithUuids);

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
      toast({
        title: "Error",
        description: "Gagal memuat data project",
        variant: "destructive"
      });
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
      if (error) throw error;

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
    } catch (error) {
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

      if (error) throw error;
      
      // Re-fetch from database to get the true new row, to prevent out-of-sync issues
      const { data: refreshedData, error: refreshError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', updatedProject.id)
        .maybeSingle();

      if (refreshError) {
        toast({
          title: "Error",
          description: "Gagal mengambil data project setelah update.",
          variant: "destructive"
        });
        throw refreshError;
      }

      if (refreshedData) {
        const refreshedProject: Project = {
          id: refreshedData.id,
          title: refreshedData.title,
          description: refreshedData.description || '',
          coverImage: refreshedData.cover_image || '',
          screenshots: refreshedData.screenshots || [],
          demoUrl: refreshedData.demo_url || '',
          category: refreshedData.category || '',
          tags: refreshedData.tags || [],
          features: refreshedData.features || [],
          createdAt: refreshedData.created_at
        };
        setProjects(prev => prev.map(p => p.id === refreshedProject.id ? refreshedProject : p));
      }

      toast({
        title: "Project updated",
        description: `${updatedProject.title} has been updated successfully.`,
      });
    } catch (error) {
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
      const projectToDelete = projects.find(p => p.id === id);
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== id));
      toast({
        title: "Project deleted",
        description: `${projectToDelete?.title || "Project"} has been deleted.`,
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus project. Silakan coba lagi.",
        variant: "destructive"
      });
      throw error;
    }
  }, [projects]);

  const refreshProjects = useCallback(async () => {
    await fetchProjects();
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
