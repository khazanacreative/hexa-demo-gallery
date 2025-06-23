
import { supabase } from './client';

export interface FileUploadResult {
  path: string;
  url: string;
}

export interface StorageBucket {
  id: string;
  name: string;
  public: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Check if a storage bucket exists
 */
export const checkBucketExists = async (bucketName: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.storage.getBucket(bucketName);
    if (error) {
      console.log(`Bucket ${bucketName} does not exist:`, error.message);
      return false;
    }
    return !!data;
  } catch (error) {
    console.error('Error checking bucket:', error);
    return false;
  }
};

/**
 * Create a new storage bucket with public access
 */
export const createBucket = async (bucketName: string): Promise<boolean> => {
  try {
    console.log(`Creating bucket: ${bucketName}`);
    
    // Create the bucket
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
      fileSizeLimit: 5242880 // 5MB
    });

    if (error) {
      console.error('Error creating bucket:', error);
      return false;
    }

    console.log('Bucket created successfully:', data);
    return true;
  } catch (error) {
    console.error('Error in createBucket:', error);
    return false;
  }
};

/**
 * Set up public access policy for a bucket
 */
export const setupBucketPolicy = async (bucketName: string): Promise<boolean> => {
  try {
    console.log(`Setting up public policy for bucket: ${bucketName}`);
    
    // Since we can't rely on RPC functions that might not exist,
    // we'll rely on the bucket being created with public: true
    // The bucket should already be public from the createBucket call
    
    return true;
  } catch (error) {
    console.error('Error setting up bucket policy:', error);
    return false;
  }
};

/**
 * Ensure a bucket exists and is properly configured
 */
export const ensureBucket = async (bucketName: string): Promise<boolean> => {
  try {
    // Check if bucket exists
    const exists = await checkBucketExists(bucketName);
    
    if (!exists) {
      console.log(`Bucket ${bucketName} doesn't exist, creating...`);
      const created = await createBucket(bucketName);
      
      if (!created) {
        console.error(`Failed to create bucket: ${bucketName}`);
        return false;
      }
      
      // Set up public access policy
      const policySetup = await setupBucketPolicy(bucketName);
      if (!policySetup) {
        console.warn(`Failed to set up policy for bucket: ${bucketName}, but bucket was created`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring bucket:', error);
    return false;
  }
};

/**
 * Upload a file to Supabase storage
 */
export const uploadFile = async (
  file: File,
  bucketName: string,
  filePath: string
): Promise<FileUploadResult | null> => {
  try {
    console.log(`Uploading file to ${bucketName}/${filePath}`);
    
    // Ensure bucket exists
    const bucketReady = await ensureBucket(bucketName);
    if (!bucketReady) {
      throw new Error(`Bucket ${bucketName} is not ready`);
    }
    
    // Upload the file
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    if (!data) {
      throw new Error('Upload failed - no data returned');
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    return {
      path: data.path,
      url: urlData.publicUrl
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
};

/**
 * Delete a file from Supabase storage
 */
export const deleteFile = async (
  bucketName: string,
  filePath: string
): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

/**
 * Get the public URL for a file
 */
export const getFileUrl = (bucketName: string, filePath: string): string => {
  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);
  
  return data.publicUrl;
};

/**
 * List files in a bucket
 */
export const listFiles = async (
  bucketName: string,
  folderPath?: string
): Promise<any[]> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(folderPath || '', {
        limit: 100,
        offset: 0
      });

    if (error) {
      console.error('List files error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
};
