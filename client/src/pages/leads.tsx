import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import type { Lead } from "@shared/schema";

export default function Leads() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  const { toast } = useToast();
  const { user, isLoading, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: leads, isLoading: leadsLoading } = useQuery({
    queryKey: ["/api/leads", searchQuery],
    enabled: !!user,
  });

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

  const getStatusColor = (status: string) => {
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

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-users text-white text-2xl animate-pulse"></i>
          </div>
          <p className="text-gray-600">Loading leads...</p>
        </div>
      </div>
    );
  }



  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Header 
          title="Leads"
          subtitle="Manage your lead database and track outreach progress."
        />
        
        <div className="p-6">
          <Card>
            <CardContent className="p-6">
              {/* Actions Bar */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <Input
                    placeholder="Search leads..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowCSVImport(true)}
                  >
                    <i className="fas fa-upload mr-2"></i>
                    Import CSV
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExport}
                  >
                    <i className="fas fa-download mr-2"></i>
                    Export CSV
                  </Button>
                  <Button
                    onClick={() => setShowLeadForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Add Lead
                  </Button>
                </div>
              </div>

              {/* Leads Table */}
              {leadsLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading leads...</p>
                </div>
              ) : leads && leads.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lead</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Contact</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead: Lead) => (
                      <TableRow key={lead.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-medium">
                                {lead.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">{lead.name}</p>
                              <p className="text-xs text-gray-500">{lead.role || 'Contact'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-900">{lead.company}</p>
                          <p className="text-xs text-gray-500">{lead.email}</p>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(lead.status)}>
                            {formatStatus(lead.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {lead.lastContactDate 
                            ? new Date(lead.lastContactDate).toLocaleDateString()
                            : "Never"
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedLead(lead);
                                setShowLeadForm(true);
                              }}
                            >
                              <i className="fas fa-edit text-gray-600"></i>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteMutation.mutate(lead.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <i className="fas fa-trash text-red-600"></i>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-users text-gray-400 text-2xl"></i>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery 
                      ? "No leads match your search criteria."
                      : "Get started by adding your first lead or importing from CSV."
                    }
                  </p>
                  {!searchQuery && (
                    <Button
                      onClick={() => setShowLeadForm(true)}
                      className="bg-primary-500 hover:bg-primary-600"
                    >
                      <i className="fas fa-plus mr-2"></i>
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
      </main>
    </div>
  );
}
