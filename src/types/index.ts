
export interface Project {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  screenshots: string[];
  demoUrl: string;
  category: string;
  tags: string[];
  features: string[];
  createdAt: string;
}

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export interface FileUploadResult {
  path: string;
  url: string;
}
