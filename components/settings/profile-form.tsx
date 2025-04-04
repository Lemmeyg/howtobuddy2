"use client";

import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { z } from "zod";

const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").optional(),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

interface ProfileFormProps {
  user: User;
  profile: any;
}

export function ProfileForm({ user, profile }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [website, setWebsite] = useState(profile?.website || "");
  const { toast } = useToast();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate form data
      const result = profileSchema.safeParse({ full_name: fullName, website });
      if (!result.success) {
        throw new Error(result.error.issues[0].message);
      }

      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName,
          website,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      toast({
        title: "Success",
        description: "Your profile has been updated.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update profile",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={user.email}
          disabled
        />
        <p className="text-sm text-muted-foreground">
          Your email address is used for login and notifications
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Enter your full name"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://example.com"
          disabled={isLoading}
        />
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
} 