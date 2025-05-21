
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase';
import { toast } from '@/components/ui/use-toast';

/**
 * Hook for managing project favorites functionality
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  /**
   * Fetch user's favorite projects
   */
  const fetchFavorites = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('favorites')
        .select('project_id')
        .eq('user_id', session.user.id);

      if (error) {
        console.error("Error fetching favorites:", error);
        return;
      }

      if (data && data.length > 0) {
        const favoriteProjectIds = data.map(item => item.project_id);
        setFavorites(favoriteProjectIds);
        console.log("Favorites fetched:", favoriteProjectIds);
      }
    } catch (error) {
      console.error("Error in fetchFavorites:", error);
    }
  }, []);

  /**
   * Add a project to favorites
   */
  const addFavorite = useCallback(async (projectId: string) => {
    try {
      // Check authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('favorites')
        .insert([
          { user_id: session.user.id, project_id: projectId }
        ]);

      if (error) {
        console.error("Error adding favorite:", error);
        throw error;
      }

      // Update local state
      setFavorites(prev => [...prev, projectId]);
      
      toast({
        title: "Project favorited",
        description: "Project has been added to your favorites.",
      });
    } catch (error) {
      console.error("Error in addFavorite:", error);
      toast({
        title: "Error",
        description: "Failed to favorite project",
        variant: "destructive"
      });
    }
  }, []);

  /**
   * Remove a project from favorites
   */
  const removeFavorite = useCallback(async (projectId: string) => {
    try {
      // Check authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', session.user.id)
        .eq('project_id', projectId);

      if (error) {
        console.error("Error removing favorite:", error);
        throw error;
      }

      // Update local state
      setFavorites(prev => prev.filter(id => id !== projectId));
      
      toast({
        title: "Project unfavorited",
        description: "Project has been removed from your favorites.",
      });
    } catch (error) {
      console.error("Error in removeFavorite:", error);
      toast({
        title: "Error",
        description: "Failed to unfavorite project",
        variant: "destructive"
      });
    }
  }, []);

  /**
   * Check if a project is favorited
   */
  const isFavorite = useCallback((projectId: string) => {
    return favorites.includes(projectId);
  }, [favorites]);

  return {
    favorites, 
    fetchFavorites, 
    addFavorite, 
    removeFavorite,
    isFavorite
  };
}
