
export interface Project {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  screenshots: string[];
  demoUrl: string;
  category: string;
  createdAt: string;
}

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  role: UserRole;
}
