import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, Trash2, Edit, UserPlus, Shield, Mail, Calendar } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export default function UsersPage() {
  const [showInviteUser, setShowInviteUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    email: "",
    role: "admin" as const
  });

  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Only head_admin can access user management
  const canManageUsers = user?.role === "head_admin";

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!user && canManageUsers,
  });

  // Create user mutation
  const sendInvitationMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      return apiRequest("POST", "/api/admin/invitations", {
        email: userData.email,
        role: userData.role
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Invitation sent successfully" });
      setShowInviteUser(false);
      setNewUser({
        email: "",
        role: "admin"
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to send invitation", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete user", variant: "destructive" });
    },
  });

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      // Get the current user data first
      const targetUser = users?.find(u => u.id === userId);
      if (!targetUser) {
        throw new Error("User not found");
      }
      
      return apiRequest("PUT", `/api/admin/users/${userId}`, {
        username: targetUser.username,
        email: targetUser.email,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        role: role
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User role updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update user role", variant: "destructive" });
    },
  });

  const handleSendInvitation = () => {
    sendInvitationMutation.mutate(newUser);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "head_admin":
        return "bg-red-100 text-red-800 border-red-200";
      case "admin":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "founder":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "strategist":
        return "bg-green-100 text-green-800 border-green-200";
      case "designer":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatRole = (role: string) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (!canManageUsers) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <main className="flex-1 ml-64">
          <Header title="User Management" />
          <div className="p-8">
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
              <p className="text-gray-500">Only head administrators can manage users.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 ml-64">
        <Header title="User Management" />
        <div className="p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">User Management</h1>
                <p className="text-gray-600">Manage team members and their access levels</p>
              </div>
              <Dialog open={showInviteUser} onOpenChange={setShowInviteUser}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Mail className="h-4 w-4 mr-2" />
                    Invite User
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Invite New User</DialogTitle>
                    <DialogDescription>
                      Send an invitation email to add a new team member to your OutreachX workspace.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter recipient's email address"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select value={newUser.role} onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value as any }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {user?.role === "head_admin" && (
                            <SelectItem value="admin">Admin</SelectItem>
                          )}
                          <SelectItem value="founder">Founder</SelectItem>
                          <SelectItem value="strategist">Strategist</SelectItem>
                          <SelectItem value="designer">Designer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowInviteUser(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSendInvitation}
                      disabled={sendInvitationMutation.isPending}
                    >
                      {sendInvitationMutation.isPending ? "Sending..." : "Send Invitation"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Users Grid */}
          {usersLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading users...</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {users?.map((userItem) => (
                <Card key={userItem.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {userItem.firstName} {userItem.lastName}
                          </h3>
                          <p className="text-sm text-gray-600">@{userItem.username}</p>
                        </div>
                      </div>
                      <Badge className={getRoleBadgeColor(userItem.role || 'designer')}>
                        {formatRole(userItem.role || 'designer')}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      {userItem.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-2" />
                          {userItem.email}
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        Joined {new Date(userItem.createdAt!).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {user?.role === "head_admin" && userItem.id !== user.id && (
                        <Select
                          value={userItem.role || 'designer'}
                          onValueChange={(value) => updateUserRoleMutation.mutate({ 
                            userId: userItem.id, 
                            role: value 
                          })}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="founder">Founder</SelectItem>
                            <SelectItem value="strategist">Strategist</SelectItem>
                            <SelectItem value="designer">Designer</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      
                      {userItem.id !== user?.id && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {userItem.firstName} {userItem.lastName}? 
                                This action cannot be undone and will remove all their data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteUserMutation.mutate(userItem.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {users?.length === 0 && !usersLoading && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users yet</h3>
              <p className="text-gray-500 mb-4">Start building your team by adding the first user</p>
              <Button onClick={() => setShowInviteUser(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add First User
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
