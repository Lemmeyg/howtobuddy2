"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash, Download } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DocumentActionsProps {
  document: {
    id: string;
    title: string;
    content?: string;
  };
}

export function DocumentActions({ document }: DocumentActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newTitle, setNewTitle] = useState(document.title);
  const router = useRouter();
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/documents/${document.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      toast({
        title: "Document deleted",
        description: "The document has been permanently deleted.",
      });

      router.refresh();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete document",
      });
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const handleRename = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/documents/${document.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: newTitle }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      toast({
        title: "Document renamed",
        description: "The document title has been updated.",
      });

      router.refresh();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to rename document",
      });
    } finally {
      setIsLoading(false);
      setShowRenameDialog(false);
    }
  };

  const handleExport = async () => {
    try {
      // Create a blob from the document content
      const blob = new Blob([document.content || ""], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${document.title}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Document exported",
        description: "The document has been downloaded.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to export document",
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => setShowRenameDialog(true)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive"
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{document.title}&quot; and all of its contents.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Enter document title"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowRenameDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              disabled={isLoading || !newTitle.trim()}
            >
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 