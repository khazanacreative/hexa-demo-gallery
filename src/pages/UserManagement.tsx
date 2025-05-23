
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { UserPlus, Trash2, Users } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const UserManagement = () => {
  const { currentUser, users, addUser, removeUser } = useAuth();
  const { toast } = useToast();
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [isAddingUser, setIsAddingUser] = useState(false);

  // Redirect if not admin - this will be handled in App.tsx with protected routes
  if (currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive" className="w-96">
          <AlertDescription>
            You don't have permission to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingUser(true);
    
    // Validasi email unik
    const emailExists = users.some(user => user.email === newUserEmail);
    if (emailExists) {
      toast({
        title: "Error",
        description: "Email already exists",
        variant: "destructive",
      });
      setIsAddingUser(false);
      return;
    }

    // Validasi password
    if (newUserPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      setIsAddingUser(false);
      return;
    }
    
    try {
      await addUser({
        email: newUserEmail.trim(),
        password: newUserPassword,
        name: newUserName.trim(),
        role: 'user' // New users are always regular users
      });
      
      toast({
        title: "Success",
        description: `User ${newUserName} has been added successfully`,
      });
      
      // Reset form
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserName('');
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add user",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleRemoveUser = async (userId: string, userName: string) => {
    // Prevent removing admin users
    const userToRemove = users.find(user => user.id === userId);
    if (userToRemove?.role === 'admin') {
      toast({
        title: "Error",
        description: "Admin users cannot be removed",
        variant: "destructive",
      });
      return;
    }

    // Prevent removing current user
    if (userId === currentUser?.id) {
      toast({
        title: "Error",
        description: "You cannot remove your own account",
        variant: "destructive",
      });
      return;
    }

    if (window.confirm(`Are you sure you want to remove ${userName}?`)) {
      try {
        await removeUser(userId);
        toast({
          title: "Success",
          description: `User ${userName} has been removed successfully`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to remove user",
          variant: "destructive",
        });
        console.error(error);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      
      <main className="flex-grow container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-hexa-red to-hexa-dark-red bg-clip-text text-transparent">
              User Management
            </h1>
            <div className="flex items-center gap-2">
              <Users size={20} className="text-gray-600" />
              <span className="text-gray-600 font-medium">{users.length} Users</span>
            </div>
          </div>
          
          {/* Add User Form */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4">Add New User</h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <Input
                    id="name"
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-hexa-red to-hexa-dark-red hover:opacity-90 flex items-center gap-2"
                  disabled={isAddingUser}
                >
                  <UserPlus size={16} />
                  {isAddingUser ? 'Adding User...' : 'Add User'}
                </Button>
              </div>
            </form>
          </div>
          
          {/* Users List */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {user.role !== 'admin' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          onClick={() => handleRemoveUser(user.id, user.name)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default UserManagement;
