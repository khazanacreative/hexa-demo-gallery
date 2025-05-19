
import React, { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProjectProvider from "./context/ProjectProvider";
import { supabase, isUserAdmin } from "./integrations/supabase/client";

// Protected route component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, checkAuthStatus } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  // Force auth check on mount
  useEffect(() => {
    const check = async () => {
      setChecking(true);
      const result = await checkAuthStatus();
      setIsAuth(result);
      setChecking(false);
    };
    check();
  }, [location.pathname, checkAuthStatus]);
  
  // Show loading state while checking
  if (checking) {
    return <div className="flex h-screen w-full items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-hexa-red"></div>
    </div>;
  }
  
  if (!isAuth && !isAuthenticated) {
    // Redirect to login with the return URL
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  
  return <>{children}</>;
};

// Admin route component
interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAuthenticated, currentUser, checkAuthStatus } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Force auth check on mount
  useEffect(() => {
    const checkAdminStatus = async () => {
      setChecking(true);
      await checkAuthStatus();
      setChecking(false);
      
      // Special case for admin@example.com
      if (currentUser?.email === 'admin@example.com') {
        console.log('Admin email detected in component');
        setIsAdmin(true);
        setLoading(false);
        return;
      }
      
      // If currentUser has admin role from context
      if (currentUser?.role === 'admin') {
        console.log('User is admin via context');
        setIsAdmin(true);
        setLoading(false);
        return;
      }
      
      // Double-check with server as final verification
      const adminStatus = await isUserAdmin();
      console.log('Admin status from server check:', adminStatus);
      setIsAdmin(adminStatus);
      setLoading(false);
    };
    
    checkAdminStatus();
  }, [currentUser, checkAuthStatus]);
  
  // Show loading state while checking
  if (checking) {
    return <div className="flex h-screen w-full items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-hexa-red"></div>
    </div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// Fixed: Moved AppRoutes inside App to ensure it's wrapped by AuthProvider
const App = () => {
  // Create a client inside the component
  const [queryClient] = React.useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          retry: false,
          staleTime: 5 * 60 * 1000, // 5 minutes
        },
      }
    })
  );

  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <AppRoutes />
            </TooltipProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

// App routes with authentication - Fixed: Moved inside App function to ensure it's wrapped by AuthProvider
const AppRoutes = () => {
  const { isAuthenticated, checkAuthStatus } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  // Check auth status on route change and initialize
  useEffect(() => {
    const verifyAuth = async () => {
      setChecking(true);
      await checkAuthStatus();
      setChecking(false);
    };
    
    verifyAuth();
  }, [location.pathname, checkAuthStatus]);

  // Setup auth listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async () => {
        await checkAuthStatus();
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [checkAuthStatus]);
  
  // Show loading state while checking
  if (checking) {
    return <div className="flex h-screen w-full items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-hexa-red"></div>
    </div>;
  }
  
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <ProjectProvider>
            <Index />
          </ProjectProvider>
        </ProtectedRoute>
      } />
      <Route path="/users" element={
        <AdminRoute>
          <UserManagement />
        </AdminRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
