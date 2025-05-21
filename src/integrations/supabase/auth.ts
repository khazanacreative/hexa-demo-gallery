
import { supabase } from './client';

/**
 * Checks if the current user has admin privileges
 * @returns Promise resolving to boolean indicating admin status
 */
export const isUserAdmin = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('No session found, not admin');
      return false;
    }
    
    // Special case for admin@example.com
    if (session.user.email === 'admin@example.com') {
      console.log('Admin email detected, granting admin access');
      
      // Check if the user already exists in profiles table
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
        
      // If profile doesn't exist or doesn't have admin role, update it
      if (profileError || !existingProfile || existingProfile.role !== 'admin') {
        console.log('Updating admin@example.com profile with admin role');
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({ 
            id: session.user.id,
            name: 'Admin User',
            email: session.user.email,
            role: 'admin'
          });
          
        if (upsertError) {
          console.error('Error upserting profile:', upsertError);
        } else {
          console.log('Successfully created/updated admin profile');
        }
      }
      
      return true;
    }
    
    // Check user metadata first (fastest)
    if (session.user.user_metadata && session.user.user_metadata.role === 'admin') {
      console.log('Admin role found in user metadata');
      return true;
    }
    
    // If not in metadata, check profiles table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
      
    if (error) {
      console.error('Error fetching profile:', error);
      // If profile fetch fails, fall back to email check
      return session.user.email === 'admin@example.com';
    }
    
    const isAdmin = profile?.role === 'admin';
    console.log('Admin status from profile:', isAdmin);
    
    // If not admin yet but email is admin@example.com, update profile
    if (!isAdmin && session.user.email === 'admin@example.com') {
      console.log('Updating admin@example.com to have admin role in profile');
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', session.user.id);
        
      if (updateError) {
        console.error('Error updating profile:', updateError);
      } else {
        console.log('Successfully updated admin role in profile');
        return true;
      }
    }
    
    return isAdmin;
  } catch (error) {
    console.error('Error checking admin status:', error);
    // On error, special case for admin@example.com as fallback
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.email === 'admin@example.com' || false;
  }
};

// Export supabase from this module to fix the import error
export { supabase };
