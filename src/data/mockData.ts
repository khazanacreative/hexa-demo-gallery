
import { Project } from '../types';
import { User } from '../types';

export const projects: Project[] = [
  {
    id: "1",
    title: "E-Commerce Platform",
    description: "A robust e-commerce solution with modern design.",
    coverImage: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    screenshots: ["/demo-screenshot.svg", "https://images.unsplash.com/photo-1555421689-d68471e189f2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"],
    demoUrl: "https://example.com/ecommerce",
    category: "Web App",
    tags: ["React", "Node.js", "MongoDB", "Stripe"],
    createdAt: "2023-05-10T00:00:00.000Z",
    features: ["Product search", "Shopping cart", "Payment processing", "Order tracking"]
  },
  {
    id: "2",
    title: "Real Estate Finder",
    description: "Find your dream home with this interactive real estate application.",
    coverImage: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1065&q=80",
    screenshots: ["/demo-screenshot.svg", "https://images.unsplash.com/photo-1523217582562-09d0def993a6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80"],
    demoUrl: "https://example.com/realestate",
    category: "Web App",
    tags: ["React", "Google Maps API", "Firebase", "Material-UI"],
    createdAt: "2023-04-15T00:00:00.000Z",
    features: ["Property search", "Map view", "Contact agent", "Favorite listings"]
  },
  {
    id: "3",
    title: "Workout Tracker",
    description: "Monitor your fitness progress with this comprehensive workout tracking app.",
    coverImage: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    screenshots: ["/demo-screenshot.svg", "https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1025&q=80"],
    demoUrl: "https://example.com/workout",
    category: "Mobile App",
    tags: ["React Native", "Firebase", "Expo", "Redux"],
    createdAt: "2023-03-20T00:00:00.000Z",
    features: ["Exercise library", "Workout plans", "Progress tracking", "Goal setting"]
  },
  {
    id: "4",
    title: "Task Management Dashboard",
    description: "Boost your productivity with this intuitive task management system.",
    coverImage: "https://images.unsplash.com/photo-1540350394557-8d14678e7f91?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1332&q=80",
    screenshots: ["/demo-screenshot.svg", "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1172&q=80"],
    demoUrl: "https://example.com/tasks",
    category: "Web App",
    tags: ["Vue.js", "Express", "MongoDB", "Tailwind CSS"],
    createdAt: "2023-02-05T00:00:00.000Z",
    features: ["Task creation", "Board view", "Deadline reminders", "Team collaboration"]
  },
  {
    id: "5",
    title: "Recipe Finder",
    description: "Discover new culinary delights with this recipe search application.",
    coverImage: "https://images.unsplash.com/photo-1495195134817-aeb325a55b65?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1176&q=80",
    screenshots: ["/demo-screenshot.svg", "https://images.unsplash.com/photo-1514986888952-8cd320577b68?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1176&q=80"],
    demoUrl: "https://example.com/recipes",
    category: "Web App",
    tags: ["React", "NextJS", "Spoonacular API", "Chakra UI"],
    createdAt: "2023-01-10T00:00:00.000Z",
    features: ["Recipe search", "Dietary filters", "Saved favorites", "Shopping lists"]
  },
  {
    id: "6",
    title: "Weather Dashboard",
    description: "Get accurate weather forecasts with this elegant weather application.",
    coverImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    screenshots: ["/demo-screenshot.svg", "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=765&q=80"],
    demoUrl: "https://example.com/weather",
    category: "Web App",
    tags: ["React", "OpenWeatherMap API", "Chart.js", "Bootstrap"],
    createdAt: "2022-12-01T00:00:00.000Z",
    features: ["Current conditions", "5-day forecast", "Location search", "Weather maps"]
  }
];

export const users: User[] = [
  {
    id: "1",
    name: "John Admin",
    role: "admin"
  },
  {
    id: "2",
    name: "Jane User",
    role: "user"
  }
];

export const allTags = [
  "React", 
  "Vue.js", 
  "Angular", 
  "Node.js", 
  "Express", 
  "MongoDB", 
  "PostgreSQL", 
  "Firebase", 
  "NextJS", 
  "Tailwind CSS", 
  "Material-UI", 
  "Bootstrap", 
  "TypeScript", 
  "JavaScript", 
  "GraphQL", 
  "REST API", 
  "Redux",
  "React Native", 
  "Flutter", 
  "Swift",
  "HTML",
  "CSS", 
  "WordPress",
  "jQuery",
  "Expo",
  "Chart.js",
  "Google Maps API",
  "OpenWeatherMap API",
  "Spoonacular API",
  "Chakra UI",
  "Stripe"
];
