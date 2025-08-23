import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { User, registerSchema, insertUserSchema, insertInvitationSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Users, Shield, User as UserIcon, Mail, Send } from "lucide-react";

type CreateUserData = Omit<z.infer<typeof registerSchema>, 'confirmPassword'>;
type InviteUserData = {
  email: string;
  role: string;
};
type Invitation = {
  id: string;
  email: string;
  role: string;
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: string;
  createdAt: string;
  acceptedAt?: string;
};

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: invitations, isLoading: invitationsLoading } = useQuery<Invitation[]>({
    queryKey: ["/api/admin/invitations"],
  });

  const inviteUserForm = useForm<InviteUserData>({
    defaultValues: {
      email: "",
      role: "designer",
    },
  });

  const editUserForm = useForm<Partial<CreateUserData>>({
    defaultValues: {
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      role: "designer",
    },
  });

  const inviteUserMutation = useMutation({
    mutationFn: async (inviteData: InviteUserData) => {
      const res = await apiRequest("POST", "/api/admin/users", inviteData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invitations"] });
      setIsCreateDialogOpen(false);
      inviteUserForm.reset();
      toast({
        title: "Invitation sent",
        description: "User invitation has been sent successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send invitation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, userData }: { id: string; userData: Partial<CreateUserData> }) => {
      const res = await apiRequest("PUT", `/api/admin/users/${id}`, userData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditingUser(null);
      editUserForm.reset();
      toast({
        title: "User updated",
        description: "User has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User deleted",
        description: "User has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteInvitationMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/invitations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invitations"] });
      toast({
        title: "Invitation deleted",
        description: "Invitation has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete invitation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check if current user has admin privileges
  if (!user || !user.role || !['head_admin', 'admin'].includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You don't have permission to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const onInviteUser = (data: InviteUserData) => {
    inviteUserMutation.mutate(data);
  };

  const onUpdateUser = (data: Partial<CreateUserData>) => {
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, userData: data });
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    editUserForm.reset({
      username: user.username,
      email: user.email || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role,
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'head_admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'admin':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'founder':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'strategist':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            User Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage users and their roles in your organization
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-invite-user">
              <Send className="h-4 w-4 mr-2" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
              <DialogDescription>
                Send an invitation email to add a new user to your organization.
              </DialogDescription>
            </DialogHeader>
            <Form {...inviteUserForm}>
              <form onSubmit={inviteUserForm.handleSubmit(onInviteUser)} className="space-y-4">
                <FormField
                  control={inviteUserForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="user@company.com" data-testid="input-invite-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={inviteUserForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger data-testid="select-invite-role">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {user?.role === 'head_admin' && (
                            <SelectItem value="admin">Admin</SelectItem>
                          )}
                          <SelectItem value="founder">Founder</SelectItem>
                          <SelectItem value="strategist">Strategist</SelectItem>
                          <SelectItem value="designer">Designer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    data-testid="button-send-invite"
                    disabled={inviteUserMutation.isPending}
                  >
                    {inviteUserMutation.isPending ? "Sending..." : "Send Invitation"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            All users in your organization and their roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4" />
                        <div>
                          <div className="font-medium" data-testid={`text-user-name-${user.id}`}>
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            @{user.username}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell data-testid={`text-user-email-${user.id}`}>
                      {user.email || 'No email'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(user.role || "")}>
                        {user.role ? user.role.replace('_', ' ') : 'No Role'}
                      </Badge>
                    </TableCell>
                    <TableCell data-testid={`text-user-created-${user.id}`}>
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog 
                          open={editingUser?.id === user.id} 
                          onOpenChange={(open) => !open && setEditingUser(null)}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              data-testid={`button-edit-${user.id}`}
                              onClick={() => handleEditUser(user)}
                              disabled={user.role === 'head_admin' && user.role !== user?.role}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Edit User</DialogTitle>
                              <DialogDescription>
                                Update user information and role.
                              </DialogDescription>
                            </DialogHeader>
                            <Form {...editUserForm}>
                              <form onSubmit={editUserForm.handleSubmit(onUpdateUser)} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <FormField
                                    control={editUserForm.control}
                                    name="firstName"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>First Name</FormLabel>
                                        <FormControl>
                                          <Input {...field} value={field.value || ""} data-testid="input-edit-firstname" />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={editUserForm.control}
                                    name="lastName"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Last Name</FormLabel>
                                        <FormControl>
                                          <Input {...field} value={field.value || ""} data-testid="input-edit-lastname" />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                                <FormField
                                  control={editUserForm.control}
                                  name="username"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Username</FormLabel>
                                      <FormControl>
                                        <Input {...field} data-testid="input-edit-username" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={editUserForm.control}
                                  name="email"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Email</FormLabel>
                                      <FormControl>
                                        <Input {...field} value={field.value || ""} type="email" data-testid="input-edit-email" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={editUserForm.control}
                                  name="role"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Role</FormLabel>
                                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                                        <FormControl>
                                          <SelectTrigger data-testid="select-edit-role">
                                            <SelectValue placeholder="Select role" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {user?.role === 'head_admin' && (
                                            <SelectItem value="admin">Admin</SelectItem>
                                          )}
                                          <SelectItem value="founder">Founder</SelectItem>
                                          <SelectItem value="strategist">Strategist</SelectItem>
                                          <SelectItem value="designer">Designer</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditingUser(null)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button 
                                    type="submit" 
                                    data-testid="button-update-user"
                                    disabled={updateUserMutation.isPending}
                                  >
                                    {updateUserMutation.isPending ? "Updating..." : "Update User"}
                                  </Button>
                                </div>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                        
                        {user?.role === 'head_admin' && user.role !== 'head_admin' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                data-testid={`button-delete-${user.id}`}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {user.firstName} {user.lastName}? 
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteUserMutation.mutate(user.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                  data-testid={`button-confirm-delete-${user.id}`}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Pending Invitations
          </CardTitle>
          <CardDescription>
            Users who have been invited but haven't completed registration yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitationsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading invitations...</div>
            </div>
          ) : !invitations || invitations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending invitations
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id} data-testid={`row-invitation-${invitation.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span data-testid={`text-invitation-email-${invitation.id}`}>
                          {invitation.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(invitation.role || "")}>
                        {invitation.role ? invitation.role.replace('_', ' ') : 'No Role'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          invitation.status === 'pending' ? 'default' : 
                          invitation.status === 'accepted' ? 'secondary' : 
                          'destructive'
                        }
                      >
                        {invitation.status}
                      </Badge>
                    </TableCell>
                    <TableCell data-testid={`text-invitation-created-${invitation.id}`}>
                      {invitation.createdAt ? new Date(invitation.createdAt).toLocaleDateString() : 'Unknown'}
                    </TableCell>
                    <TableCell data-testid={`text-invitation-expires-${invitation.id}`}>
                      {invitation.expiresAt ? new Date(invitation.expiresAt).toLocaleDateString() : 'No expiry'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {invitation.status === 'pending' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                data-testid={`button-delete-invitation-${invitation.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Invitation</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this invitation? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteInvitationMutation.mutate(invitation.id)}
                                  disabled={deleteInvitationMutation.isPending}
                                >
                                  {deleteInvitationMutation.isPending ? "Deleting..." : "Delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}