
import { Project, User } from '../types';

export const projects: Project[] = [
  {
    id: '1',
    title: 'HEXA Dashboard',
    description: 'A modern admin dashboard with complex data visualization and user management capabilities. Built with React and Tailwind CSS.',
    coverImage: '/placeholder.svg',
    screenshots: ['/demo-screenshot.svg', '/placeholder.svg', '/placeholder.svg'],
    demoUrl: 'https://example.com/demo1',
    category: 'Web App',
    tags: ['dashboard', 'admin', 'visualization', 'react'],
    features: ['Real-time data visualization', 'User management', 'Advanced analytics'],
    createdAt: '2023-10-15',
  },
  {
    id: '2',
    title: 'EcoTrack Mobile',
    description: 'Environmental monitoring app with real-time data processing for sustainable living. Features include carbon footprint calculation and eco-tips.',
    coverImage: '/placeholder.svg',
    screenshots: ['/demo-screenshot.svg', '/placeholder.svg'],
    demoUrl: 'https://example.com/demo2',
    category: 'Mobile App',
    tags: ['mobile', 'environment', 'sustainability', 'tracking'],
    features: ['Carbon footprint tracking', 'Eco-tips', 'Sustainability score'],
    createdAt: '2023-11-20',
  },
  {
    id: '3',
    title: 'Creative Portfolio',
    description: 'Stunning portfolio website for digital artists with interactive galleries. Includes animation effects and custom scrolling experiences.',
    coverImage: '/placeholder.svg',
    screenshots: ['/demo-screenshot.svg', '/placeholder.svg', '/placeholder.svg', '/placeholder.svg'],
    demoUrl: 'https://example.com/demo3',
    category: 'Website',
    tags: ['portfolio', 'gallery', 'creative', 'animation'],
    features: ['Interactive galleries', 'Animation effects', 'Custom scrolling'],
    createdAt: '2024-01-05',
  },
  {
    id: '4',
    title: 'FinTech Platform',
    description: 'Comprehensive financial technology solution with advanced analytics and reporting. Includes expense tracking, budget planning, and investment insights.',
    coverImage: '/placeholder.svg',
    screenshots: ['/demo-screenshot.svg', '/placeholder.svg'],
    demoUrl: 'https://example.com/demo4',
    category: 'Web App',
    tags: ['finance', 'analytics', 'reporting', 'fintech'],
    features: ['Expense tracking', 'Budget planning', 'Investment insights'],
    createdAt: '2024-02-18',
  },
  {
    id: '5',
    title: 'Health Tracker',
    description: 'Personal health monitoring app with AI-driven insights and recommendations. Tracks exercise, nutrition, sleep, and provides personalized health plans.',
    coverImage: '/placeholder.svg',
    screenshots: ['/demo-screenshot.svg', '/placeholder.svg', '/placeholder.svg'],
    demoUrl: 'https://example.com/demo5',
    category: 'Mobile App',
    tags: ['health', 'fitness', 'tracking', 'ai', 'mobile'],
    features: ['Exercise tracking', 'Nutrition plans', 'Sleep monitoring'],
    createdAt: '2024-03-10',
  },
  {
    id: '6',
    title: 'E-Commerce Store',
    description: 'Feature-rich online shopping platform with seamless checkout experience. Built with Next.js and includes payment processing, inventory management, and customer accounts.',
    coverImage: '/placeholder.svg',
    screenshots: ['/demo-screenshot.svg', '/placeholder.svg'],
    demoUrl: 'https://example.com/demo6',
    category: 'Website',
    tags: ['ecommerce', 'shopping', 'nextjs', 'payment'],
    features: ['Payment processing', 'Inventory management', 'Customer accounts'],
    createdAt: '2024-04-05',
  },
];

export const users: User[] = [
  {
    id: '1',
    name: 'Admin User',
    role: 'admin',
  },
  {
    id: '2',
    name: 'Test User',
    role: 'user',
  },
];

export const currentUser: User = users[0]; // Default to admin for demo

export const allTags = Array.from(
  new Set(projects.flatMap(project => project.tags))
).sort();
