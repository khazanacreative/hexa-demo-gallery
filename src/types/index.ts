
export interface Project {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  screenshots: string[];
  demoUrl: string;
  category: string;
  tags: string[];
  features: string[]; // Added features field
  createdAt: string;
}

export type UserRole = 'admin' | 'user';

// Add the User interface that was missing
export interface User {
  id: string;
  name: string;
  role: UserRole;
}

// Add the FileUploadResult interface for ImageUploader
export interface FileUploadResult {
  path: string;
  url: string;
}
