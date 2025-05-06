
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Lock, AtSign, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already authenticated, redirect to home
    if (isAuthenticated) {
      navigate('/');
    }
    
    // Check for authentication errors in URL
    const url = new URL(window.location.href);
    const errorDescription = url.searchParams.get('error_description');
    if (errorDescription) {
      setError(decodeURIComponent(errorDescription));
      toast({
        title: "Login Error",
        description: decodeURIComponent(errorDescription),
        variant: "destructive",
      });
    }
  }, [isAuthenticated, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Attempting login with:', email);
      
      // Special handling for admin@example.com
      const isAdminLogin = email.toLowerCase() === 'admin@example.com';
      if (isAdminLogin) {
        console.log('Admin login detected, ensuring admin role will be set');
      }
      
      const success = await login(email, password);
      if (success) {
        // For admin login, verify the role is set correctly
        if (isAdminLogin) {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            console.log('Admin login successful, confirming admin role');
            
            // Verify profile has admin role
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single();
              
              if (profile) {
                console.log('Admin profile role:', profile.role);
                
                // Update profile to admin role if not already
                if (profile.role !== 'admin') {
                  const { error } = await supabase
                    .from('profiles')
                    .update({ role: 'admin' })
                    .eq('id', session.user.id);
                    
                  if (error) {
                    console.error('Failed to update admin role:', error);
                  } else {
                    console.log('Updated to admin role successfully');
                  }
                }
              }
            } catch (error) {
              console.error('Error verifying admin role:', error);
            }
          }
        }
        
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        navigate('/');
      } else {
        setError("Invalid email or password");
        toast({
          title: "Login failed",
          description: "Invalid email or password",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || "An error occurred during login");
      toast({
        title: "Login error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-hexa-red to-hexa-dark-red bg-clip-text text-transparent">
            Galeri Hexa
          </h1>
          <p className="mt-2 text-gray-600">Sign in to access the application</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md flex items-center gap-2">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          <div className="space-y-4">
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="email"
                placeholder="Email address"
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="password"
                placeholder="Password"
                className="pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-hexa-red to-hexa-dark-red hover:opacity-90"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
          
          <div className="text-center text-sm text-gray-500 mt-4">
            <p>Demo credentials:</p>
            <p className="font-semibold">Admin: admin@example.com / password</p>
            <p>User: user@example.com / password</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
