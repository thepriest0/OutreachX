import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import LeadForm from "@/components/leads/lead-form";
import CSVImport from "@/components/leads/csv-import";
import AIEmailGenerator from "@/components/email/ai-email-generator";
import { Edit, Trash2, Search, Plus, Upload, Download, Mail } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { Lead } from "@shared/schema";

export default function Leads() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showEmailGenerator, setShowEmailGenerator] = useState(false);
  const [selectedLeadForEmail, setSelectedLeadForEmail] = useState<Lead | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [, setLocation] = useLocation();

  const { toast } = useToast();
  const { user, isLoading, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: leads, isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
    enabled: !!user,
  });

  // Filter leads based on search query and status
  const filteredLeads = leads?.filter((lead: Lead) => {
    const matchesSearch = !searchQuery || 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const deleteMutation = useMutation({
    mutationFn: async (leadId: string) => {
      await apiRequest("DELETE", `/api/leads/${leadId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Success",
        description: "Lead deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete lead",
        variant: "destructive",
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map(id => apiRequest("DELETE", `/api/leads/${id}`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setSelectedLeadIds([]);
      toast({ title: "Success", description: "Selected leads deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete selected leads", variant: "destructive" });
    }
  });

  const handleExport = async () => {
    try {
      const response = await fetch("/api/leads/export", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "leads.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Leads exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export leads",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return "bg-gray-100 text-gray-800";
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800";
      case "contacted":
        return "bg-yellow-100 text-yellow-800";
      case "replied":
        return "bg-green-100 text-green-800";
      case "follow_up_scheduled":
        return "bg-purple-100 text-purple-800";
      case "qualified":
        return "bg-emerald-100 text-emerald-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedLeadIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAllVisible = () => {
    const ids = filteredLeads.map(l => l.id);
    setSelectedLeadIds(ids);
  };

  const clearSelection = () => setSelectedLeadIds([]);

  const handleExportSelected = async () => {
    try {
      const response = await fetch('/api/leads/export', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedLeadIds }),
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'selected-leads.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({ title: 'Success', description: 'Selected leads exported' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to export selected leads', variant: 'destructive' });
    }
  };

  const formatStatus = (status: string | null) => {
    if (!status) return "Unknown";
    return status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-white animate-pulse" />
          </div>
          <p className="text-muted-foreground">Loading leads...</p>
        </div>
      </div>
    );
  }



  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Header 
          title="Leads"
          subtitle="Manage your lead database and track outreach progress."
        />

        <div className="p-2 pt-4 sm:p-6 sm:pt-6">
          <Card>
              <CardContent className="p-2 sm:p-6">
              {/* Actions Bar */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-4 flex-wrap">
                  <Input
                    placeholder="Search leads..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-64"
                  />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="replied">Replied</SelectItem>
                      <SelectItem value="follow_up_scheduled">Follow-up Scheduled</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-3 flex-shrink-0 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={() => setShowCSVImport(true)}
                    data-testid="button-import-csv"
                    className="w-full sm:w-auto"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import CSV
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExport}
                    data-testid="button-export-csv"
                    className="w-full sm:w-auto"
                  >
                    <Download className="h-4 w-4 mr-2" />
                  {selectedLeadIds.length > 0 && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => handleExportSelected()}
                        className="w-full sm:w-auto"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Selected
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => bulkDeleteMutation.mutate(selectedLeadIds)}
                        className="w-full sm:w-auto"
                        disabled={bulkDeleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Selected
                      </Button>
                    </>
                  )}
                    Export CSV
                  </Button>
                  <Button
                    onClick={() => setShowLeadForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap w-full sm:w-auto"
                    data-testid="button-add-lead"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Lead
                  </Button>
                </div>
              </div>

              {/* Leads Table or Cards */}
              {leadsLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading leads...</p>
                </div>
              ) : filteredLeads && filteredLeads.length > 0 ? (
                <>
                  {/* Desktop Table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <Table className="min-w-[600px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs sm:text-sm w-8">
                            <Checkbox
                              checked={filteredLeads.length > 0 && selectedLeadIds.length === filteredLeads.length}
                              onCheckedChange={(val) => (val ? selectAllVisible() : clearSelection())}
                              aria-label="Select all leads"
                            />
                          </TableHead>
                          <TableHead className="text-xs sm:text-sm">Lead</TableHead>
                          <TableHead className="text-xs sm:text-sm">Company</TableHead>
                          <TableHead className="text-xs sm:text-sm">Status</TableHead>
                          <TableHead className="text-xs sm:text-sm">Last Contact</TableHead>
                          <TableHead className="text-xs sm:text-sm">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLeads.map((lead: Lead) => (
                          <TableRow key={lead.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedLeadIds.includes(lead.id)}
                                onCheckedChange={() => toggleSelect(lead.id)}
                                aria-label={`Select lead ${lead.name}`}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs font-medium">
                                    {lead.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                  </span>
                                </div>
                                <div className="ml-3">
                                  <p className="text-xs sm:text-sm font-medium text-foreground">{lead.name}</p>
                                  <p className="text-[10px] sm:text-xs text-muted-foreground">{lead.role || 'Contact'}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-xs sm:text-sm text-foreground">{lead.company}</p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground">{lead.email}</p>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(lead.status) + ' text-[10px] sm:text-xs px-2 py-1'}>
                                {formatStatus(lead.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-[10px] sm:text-sm text-muted-foreground">
                              {lead.lastContactDate 
                                ? new Date(lead.lastContactDate).toLocaleDateString()
                                : "Never"
                              }
                            </TableCell>
                            <TableCell className="p-2 align-middle [&:has([role=checkbox])]:pr-0 bg-[#b8484800]">
                              <div className="flex items-center space-x-1 sm:space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-card/50"
                                  onClick={() => {
                                    setSelectedLeadForEmail(lead);
                                    setShowEmailGenerator(true);
                                  }}
                                  data-testid={`button-email-${lead.id}`}
                                  title="Send email to this lead"
                                >
                                  <Mail className="h-4 w-4 text-blue-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-gray-100"
                                  onClick={() => {
                                    setSelectedLead(lead);
                                    setShowLeadForm(true);
                                  }}
                                  data-testid={`button-edit-${lead.id}`}
                                >
                                  <Edit className="h-4 w-4 text-muted-foreground" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-red-100"
                                  onClick={() => deleteMutation.mutate(lead.id)}
                                  disabled={deleteMutation.isPending}
                                  data-testid={`button-delete-${lead.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {/* Mobile Cards */}
                  <div className="sm:hidden flex flex-col gap-3">
                    {filteredLeads.map((lead: Lead) => (
                      <div key={lead.id} className="bg-card rounded-lg shadow-sm p-4 flex flex-col gap-3 border border-border">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-gray-700 text-base font-semibold">
                              {lead.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-base font-medium text-foreground leading-tight">{lead.name}</p>
                            <p className="text-xs text-muted-foreground">{lead.role || 'Contact'}</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <p className="text-sm text-foreground font-medium">{lead.company}</p>
                          <p className="text-xs text-muted-foreground">{lead.email}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getStatusColor(lead.status) + ' text-xs px-2 py-1 font-medium'}>
                            {formatStatus(lead.status)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{lead.lastContactDate ? new Date(lead.lastContactDate).toLocaleDateString() : "Never"}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Checkbox
                            checked={selectedLeadIds.includes(lead.id)}
                            onCheckedChange={() => toggleSelect(lead.id)}
                            aria-label={`Select lead ${lead.name}`}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded hover:bg-gray-100"
                            onClick={() => {
                              setSelectedLeadForEmail(lead);
                              setShowEmailGenerator(true);
                            }}
                            data-testid={`button-email-${lead.id}`}
                            title="Send email to this lead"
                          >
                            <Mail className="h-4 w-4 text-gray-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded hover:bg-gray-100"
                            onClick={() => {
                              setSelectedLead(lead);
                              setShowLeadForm(true);
                            }}
                            data-testid={`button-edit-${lead.id}`}
                          >
                            <Edit className="h-4 w-4 text-gray-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded hover:bg-gray-100"
                            onClick={() => deleteMutation.mutate(lead.id)}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-${lead.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-gray-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-card/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">No leads found</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                    {searchQuery 
                      ? "No leads match your search criteria."
                      : "Get started by adding your first lead or importing from CSV."
                    }
                  </p>
                  {!searchQuery && (
                    <Button
                      onClick={() => setShowLeadForm(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      data-testid="button-add-first-lead"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Lead
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lead Form Modal */}
        {showLeadForm && (
          <LeadForm
            lead={selectedLead}
            onClose={() => {
              setShowLeadForm(false);
              setSelectedLead(null);
            }}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
              setShowLeadForm(false);
              setSelectedLead(null);
            }}
          />
        )}

        {/* CSV Import Modal */}
        {showCSVImport && (
          <CSVImport
            onClose={() => setShowCSVImport(false)}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
              setShowCSVImport(false);
            }}
          />
        )}

        {/* AI Email Generator Modal */}
        {showEmailGenerator && selectedLeadForEmail && (
          <AIEmailGenerator
            preselectedLead={selectedLeadForEmail}
            onClose={() => {
              setShowEmailGenerator(false);
              setSelectedLeadForEmail(null);
            }}
            onSuccess={() => {
              setShowEmailGenerator(false);
              setSelectedLeadForEmail(null);
              toast({
                title: "Success",
                description: "Email campaign created successfully!",
              });
            }}
          />
        )}
      </main>
    </div>
  );
}