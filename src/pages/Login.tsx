
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Lock, AtSign } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    console.log('Login attempt for:', email);
    
    try {
      const success = await login(email, password);
      console.log('Login result:', success);
      
      if (success) {
        toast({
          title: "Login berhasil",
          description: "Selamat datang kembali!",
        });
        navigate('/');
      } else {
        toast({
          title: "Login gagal",
          description: "Email atau password tidak valid",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Error login",
        description: "Terjadi kesalahan saat login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2072&q=80')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-gray-900/60 to-hexa-red/20"></div>
      
      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md p-8 space-y-8 bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl border border-white/20">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-hexa-red to-hexa-dark-red bg-clip-text text-transparent">
            Galeri Hexa
          </h1>
          <p className="mt-2 text-gray-600">Masuk untuk mengakses aplikasi</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="email"
                placeholder="Alamat email"
                className="pl-10 bg-white/90 border-gray-200 focus:border-hexa-red"
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
                className="pl-10 bg-white/90 border-gray-200 focus:border-hexa-red"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-hexa-red to-hexa-dark-red hover:opacity-90 shadow-lg"
            disabled={isLoading}
          >
            {isLoading ? 'Sedang masuk...' : 'Masuk'}
          </Button>
          
          <div className="text-center text-sm text-gray-600 mt-4 bg-white/80 p-3 rounded-md">
            <p className="font-medium mb-1">Kredensial demo:</p>
            <p>Admin: admin@example.com / password</p>
            <p>User: user@example.com / password</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
