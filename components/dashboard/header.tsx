"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import {
  Bell,
  Plus,
} from "lucide-react";

export function DashboardHeader() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClientComponentClient();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign out. Please try again.",
      });
      return;
    }

    router.push("/login");
  };

  return (
    <header className="h-16 border-b bg-white px-6">
      <div className="h-full flex items-center justify-between">
        <div>
          {/* Left side - can add breadcrumbs or section title here */}
        </div>

        <div className="flex items-center space-x-4">
          {/* New Document Button */}
          <Button
            onClick={() => router.push("/dashboard/documents/new")}
            className="hidden sm:flex"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Document
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-600" />
          </Button>

          {/* Sign Out */}
          <Button
            variant="ghost"
            onClick={handleSignOut}
          >
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
} 