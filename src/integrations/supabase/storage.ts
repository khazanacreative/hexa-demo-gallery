
import { supabase } from './client';

/**
 * Check if a storage bucket exists
 * @param bucketName Name of the bucket to check
 * @returns Promise resolving to boolean indicating if bucket exists
 */
export const checkStorageBucket = async (bucketName: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.storage.getBucket(bucketName);
    if (error) {
      console.error(`Bucket ${bucketName} check failed:`, error);
      
      // Try to create the bucket if it doesn't exist
      if (error.message.includes('does not exist')) {
        console.log(`Attempting to create bucket ${bucketName}`);
        
        // Define the bucket creation options with the correct type
        const bucketOptions = {
          public: true,
          fileSizeLimit: 10 * 1024 * 1024, // 10MB
          allowedMimeTypes: ['image/*']
        };
        
        // Use the correctly typed bucket options
        const { data: createData, error: createError } = await supabase.storage.createBucket(
          bucketName, 
          bucketOptions
        );
        
        if (createError) {
          console.error(`Failed to create bucket ${bucketName}:`, createError);
          return false;
        }
        
        console.log(`Successfully created bucket ${bucketName}`);
        return true;
      }
      
      return false;
    }
    console.log(`Bucket ${bucketName} exists:`, data);
    return !!data;
  } catch (error) {
    console.error(`Error checking bucket ${bucketName}:`, error);
    return false;
  }
};

/**
 * Ensures the project-images bucket exists, creating it if it doesn't
 * @returns Promise resolving to boolean indicating success
 */
export const ensureProjectImagesBucket = async (): Promise<boolean> => {
  const bucketName = 'project-images';
  try {
    // First check if bucket exists
    const { data: bucketData, error: bucketError } = await supabase.storage.getBucket(bucketName);
    
    // If bucket doesn't exist, try to create it
    if (bucketError && bucketError.message.includes('does not exist')) {
      console.log(`${bucketName} bucket does not exist, creating it...`);
      
      // Define bucket options with correct types
      const bucketOptions = {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024, // 10MB
        allowedMimeTypes: ['image/*']
      };
      
      // Use the correctly typed bucket options
      const { error: createError } = await supabase.storage.createBucket(
        bucketName, 
        bucketOptions
      );
      
      if (createError) {
        console.error(`Failed to create ${bucketName} bucket:`, createError);
        return false;
      }
      
      console.log(`Successfully created ${bucketName} bucket`);
      
      // Now set up the bucket policy for public access
      try {
        // Fix for TypeScript error: Pass bucket_id parameter correctly
        const { error: policyError } = await supabase.rpc(
          'create_public_bucket_policy',
          { bucket_id: bucketName }
        );
        
        if (policyError) {
          console.warn(`Note: Could not set public policy on bucket: ${policyError.message}`);
          // Continue anyway as the bucket was created
        }
      } catch (policyError) {
        console.warn(`Failed to set bucket policy: ${policyError}`);
        // Continue as bucket was still created
      }
      
      return true;
    } else if (bucketError) {
      console.error(`Error checking ${bucketName} bucket:`, bucketError);
      return false;
    }
    
    console.log(`${bucketName} bucket exists:`, bucketData);
    return true;
  } catch (error) {
    console.error(`Error in ensureProjectImagesBucket:`, error);
    return false;
  }
};
