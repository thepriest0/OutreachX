import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import type { CSVImportResult } from "@/types";

interface CSVImportProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CSVImport({ onClose, onSuccess }: CSVImportProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [importResult, setImportResult] = useState<CSVImportResult | null>(null);
  const { toast } = useToast();

  const downloadTemplate = async () => {
    try {
      const response = await fetch("/api/leads/csv-template", {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to download template");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "leads-template.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "CSV template downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download template",
        variant: "destructive",
      });
    }
  };

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch("/api/leads/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Import failed");
      }
      
      return response.json();
    },
    onSuccess: (data: CSVImportResult) => {
      setImportResult(data);
      if (!data.errors || data.errors.length === 0) {
        toast({
          title: "Success",
          description: data.message,
        });
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
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
      
      try {
        const errorMessage = error.message;
        if (errorMessage.includes("Validation errors")) {
          const errorData = JSON.parse(errorMessage.split(": ")[1]);
          setImportResult(errorData);
        } else {
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to import CSV file",
          variant: "destructive",
        });
      }
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        setSelectedFile(file);
      } else {
        toast({
          title: "Error",
          description: "Please select a valid CSV file",
          variant: "destructive",
        });
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        setSelectedFile(file);
      } else {
        toast({
          title: "Error",
          description: "Please select a valid CSV file",
          variant: "destructive",
        });
      }
    }
  };

  const handleImport = () => {
    if (selectedFile) {
      importMutation.mutate(selectedFile);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <i className="fas fa-upload mr-3 text-primary-500"></i>
            Import Leads from CSV
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import leads into your database.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Download */}
          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-download text-blue-600"></i>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Download CSV Template</h3>
              <p className="text-sm text-gray-600 mb-4">
                Download our template to ensure your CSV file has the correct format.
              </p>
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <i className="fas fa-download mr-2"></i>
                Download Template
              </Button>
            </CardContent>
          </Card>

          {/* File Upload */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? "border-primary-500 bg-primary-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="space-y-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
                  <i className="fas fa-file-csv text-green-600"></i>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-600">{formatFileSize(selectedFile.size)}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSelectedFile(null)}
                  className="text-gray-600"
                >
                  <i className="fas fa-times mr-2"></i>
                  Remove File
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto">
                  <i className="fas fa-cloud-upload-alt text-gray-400"></i>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Drag and drop your CSV file here</p>
                  <p className="text-sm text-gray-600">or click to browse</p>
                </div>
                <div>
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="csv-upload"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById("csv-upload")?.click()}
                  >
                    <i className="fas fa-folder-open mr-2"></i>
                    Select CSV File
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Import Progress */}
          {importMutation.isPending && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Importing leads...</span>
                <span>Processing</span>
              </div>
              <Progress value={50} className="w-full" />
            </div>
          )}

          {/* Import Results */}
          {importResult && (
            <div className="space-y-4">
              {importResult.errors && importResult.errors.length > 0 ? (
                <Alert variant="destructive">
                  <i className="fas fa-exclamation-triangle"></i>
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">Import completed with errors:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {importResult.errors.slice(0, 5).map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                        {importResult.errors.length > 5 && (
                          <li>... and {importResult.errors.length - 5} more errors</li>
                        )}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-green-200 bg-green-50">
                  <i className="fas fa-check-circle text-green-600"></i>
                  <AlertDescription className="text-green-800">
                    {importResult.message}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={importMutation.isPending}
          >
            {importResult && !importResult.errors ? "Close" : "Cancel"}
          </Button>
          {!importResult && (
            <Button
              onClick={handleImport}
              disabled={!selectedFile || importMutation.isPending}
              className="bg-primary-500 hover:bg-primary-600"
            >
              {importMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Importing...
                </>
              ) : (
                <>
                  <i className="fas fa-upload mr-2"></i>
                  Import Leads
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
