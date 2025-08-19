import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Users, 
  MoreHorizontal, 
  Mail, 
  Phone, 
  Building2, 
  Calendar,
  Eye,
  Edit3,
  Trash2,
  Send
} from "lucide-react";

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  role?: string;
  status: "new" | "contacted" | "replied" | "qualified" | "closed";
  lastContactDate?: string;
  createdAt: string;
  avatar?: string;
  notes?: string;
}

const statusConfig = {
  new: {
    label: "New",
    className: "status-new",
    icon: Users
  },
  contacted: {
    label: "Contacted",
    className: "status-contacted",
    icon: Mail
  },
  replied: {
    label: "Replied",
    className: "status-replied",
    icon: Phone
  },
  qualified: {
    label: "Qualified",
    className: "status-qualified",
    icon: Building2
  },
  closed: {
    label: "Closed",
    className: "status-closed",
    icon: Calendar
  }
};

function LeadRow({ lead }: { lead: Lead }) {
  const status = statusConfig[lead.status];
  const StatusIcon = status.icon;
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex items-center space-x-4 py-3 border-b border-border/50 last:border-0">
      <Avatar className="h-10 w-10">
        <AvatarImage src={lead.avatar} alt={lead.name} />
        <AvatarFallback className="text-xs font-medium">
          {getInitials(lead.name)}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <h4 className="text-sm font-medium truncate">{lead.name}</h4>
          <Badge className={`text-xs px-1.5 py-0.5 ${status.className}`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {status.label}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
          <span className="truncate">{lead.email}</span>
          <span>•</span>
          <span className="truncate">{lead.company}</span>
          {lead.role && (
            <>
              <span>•</span>
              <span className="truncate">{lead.role}</span>
            </>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground mt-1">
          {lead.lastContactDate ? (
            <>Last contact: {formatDate(lead.lastContactDate)}</>
          ) : (
            <>Added: {formatDate(lead.createdAt)}</>
          )}
        </div>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" data-testid={`button-lead-menu-${lead.id}`}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem data-testid={`menu-item-view-${lead.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            <span>View Details</span>
          </DropdownMenuItem>
          <DropdownMenuItem data-testid={`menu-item-email-${lead.id}`}>
            <Send className="mr-2 h-4 w-4" />
            <span>Send Email</span>
          </DropdownMenuItem>
          <DropdownMenuItem data-testid={`menu-item-edit-${lead.id}`}>
            <Edit3 className="mr-2 h-4 w-4" />
            <span>Edit Lead</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="text-destructive focus:text-destructive"
            data-testid={`menu-item-delete-${lead.id}`}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete Lead</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function RecentLeadsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-8 w-20 rounded" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 py-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function RecentLeads() {
  const { data: leads, isLoading, error } = useQuery<Lead[]>({
    queryKey: ["/api/dashboard/recent-leads"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return <RecentLeadsSkeleton />;
  }

  if (error || !leads) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-destructive" />
            <span>Recent Leads</span>
          </CardTitle>
          <CardDescription>
            Unable to load recent leads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Failed to load leads. Please try again.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!leads.length) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <span>Recent Leads</span>
              </CardTitle>
              <CardDescription>
                Your latest prospects and contacts
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" data-testid="button-add-first-lead">
              Add Lead
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="p-3 rounded-full bg-muted/50 w-fit mx-auto mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-2">No leads yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start building your pipeline by adding your first lead or importing from CSV.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button size="sm" data-testid="button-add-lead-empty">
                Add Your First Lead
              </Button>
              <Button variant="outline" size="sm" data-testid="button-import-leads-empty">
                Import from CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-hover" data-testid="recent-leads-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <span>Recent Leads</span>
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                {leads.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Your latest prospects and their current status
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" data-testid="button-view-all-leads">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {leads.slice(0, 8).map((lead) => (
            <LeadRow key={lead.id} lead={lead} />
          ))}
        </div>
        
        {leads.length > 8 && (
          <div className="pt-4 border-t mt-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full"
              data-testid="button-load-more-leads"
            >
              Load more leads ({leads.length - 8} remaining)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}