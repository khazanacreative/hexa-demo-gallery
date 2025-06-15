import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { UserPlus, Trash2, Users } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CategoryPermission } from '@/types';

const UserManagement = () => {
  const { currentUser, users, addUser, removeUser } = useAuth();
  const { toast } = useToast();
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<CategoryPermission[]>(['web-app', 'mobile-app']);
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

  const handlePermissionChange = (permission: CategoryPermission, checked: boolean) => {
    setSelectedPermissions(prev => 
      checked 
        ? [...prev, permission]
        : prev.filter(p => p !== permission)
    );
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingUser(true);
    
    try {
      await addUser({
        email: newUserEmail,
        password: newUserPassword,
        name: newUserName,
        role: 'user',
        categoryPermissions: selectedPermissions
      });
      
      toast({
        title: "User added",
        description: `${newUserName} has been added successfully`,
      });
      
      // Reset form
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserName('');
      setSelectedPermissions(['web-app', 'mobile-app']);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add user",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleRemoveUser = async (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to remove ${userName}?`)) {
      try {
        await removeUser(userId);
        toast({
          title: "User removed",
          description: `${userName} has been removed successfully`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to remove user",
          variant: "destructive",
        });
        console.error(error);
      }
    }
  };

  const getCategoryLabel = (permission: CategoryPermission) => {
    switch (permission) {
      case 'web-app': return 'Web App';
      case 'mobile-app': return 'Mobile App';
      case 'website': return 'Website';
      default: return permission;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <Header onRoleToggle={() => {}} />
      
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Permissions
                </label>
                <div className="flex gap-4">
                  {(['web-app', 'mobile-app', 'website'] as CategoryPermission[]).map((permission) => (
                    <div key={permission} className="flex items-center space-x-2">
                      <Checkbox
                        id={permission}
                        checked={selectedPermissions.includes(permission)}
                        onCheckedChange={(checked) => handlePermissionChange(permission, checked as boolean)}
                      />
                      <label htmlFor={permission} className="text-sm text-gray-700">
                        {getCategoryLabel(permission)}
                      </label>
                    </div>
                  ))}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permissions
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex flex-wrap gap-1">
                        {user.categoryPermissions?.map(permission => (
                          <span key={permission} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {getCategoryLabel(permission)}
                          </span>
                        ))}
                      </div>
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
