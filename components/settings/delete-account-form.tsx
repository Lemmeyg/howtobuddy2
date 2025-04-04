"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
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
import { useRouter } from "next/navigation";

export function DeleteAccountForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  async function onDelete() {
    if (confirmText !== "DELETE") {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please type DELETE to confirm",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/user/delete", {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });

      // Redirect to home page
      router.push("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete account",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Once you delete your account, there is no going back. Please be certain.
      </p>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">
            Delete Account
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove all your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="confirm">
              Please type <span className="font-semibold">DELETE</span> to confirm
            </Label>
            <Input
              id="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              disabled={isLoading}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              disabled={isLoading || confirmText !== "DELETE"}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "Deleting..." : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 