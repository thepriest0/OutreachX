import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { insertLeadSchema, type Lead } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface LeadFormProps {
  lead?: Lead | null;
  onClose: () => void;
  onSuccess: () => void;
}

const leadFormSchema = insertLeadSchema.extend({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  company: z.string().min(1, "Company is required"),
  role: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["new", "contacted", "replied", "follow_up_scheduled", "qualified", "closed"]).optional(),
});

type LeadFormData = z.infer<typeof leadFormSchema>;

export default function LeadForm({ lead, onClose, onSuccess }: LeadFormProps) {
  const { toast } = useToast();
  const isEditing = !!lead;

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: lead?.name || "",
      email: lead?.email || "",
      company: lead?.company || "",
      role: lead?.role || "",
      notes: lead?.notes || "",
      status: lead?.status || "new",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: LeadFormData) => {
      const response = await apiRequest("POST", "/api/leads", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Lead created successfully",
      });
      onSuccess();
    },
    onError: (error) => {
      if (false) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/auth";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create lead",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: LeadFormData) => {
      const response = await apiRequest("PUT", `/api/leads/${lead!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Lead updated successfully",
      });
      onSuccess();
    },
    onError: (error) => {
      if (false) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/auth";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update lead",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LeadFormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 sm:p-6 w-full h-full sm:h-auto sm:rounded-lg rounded-none flex flex-col justify-center">
        <div className="p-4 sm:p-0 h-full overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-lg sm:text-xl">
              <i className="fas fa-user-plus mr-3 text-primary-500"></i>
              {isEditing ? "Edit Lead" : "Add New Lead"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {isEditing 
                ? "Update the lead information below." 
                : "Fill in the details to add a new lead to your database."
              }
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} className="text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input placeholder="john@example.com" type="email" {...field} className="text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company *</FormLabel>
                      <FormControl>
                        <Input placeholder="Example Corp" {...field} className="text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role/Title</FormLabel>
                      <FormControl>
                        <Input placeholder="CEO, Marketing Director, etc." {...field} className="text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select lead status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="replied">Replied</SelectItem>
                        <SelectItem value="follow_up_scheduled">Follow-up Scheduled</SelectItem>
                        <SelectItem value="qualified">Qualified</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field}
                        placeholder="Any additional notes about this lead..."
                        className="min-h-[100px] text-sm" />
                    </FormControl>
                    <FormDescription>
                      Optional notes to help personalize your outreach
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isPending}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                >
                  {isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      {isEditing ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <i className={`fas ${isEditing ? "fa-save" : "fa-plus"} mr-2`}></i>
                      {isEditing ? "Update Lead" : "Create Lead"}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
