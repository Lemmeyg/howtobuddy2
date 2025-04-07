"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { getSupabaseClient } from "@/lib/supabase/singleton";
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

export function DashboardUrlSubmissionForm() {
  const [url, setUrl] = useState("");
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient<Database> | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      console.error('Failed to initialize Supabase client');
      toast({
        title: "Error",
        description: "Failed to initialize application. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }
    setSupabaseClient(client);
  }, [toast]);

  const isValidYoutubeUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    return youtubeRegex.test(url);
  };

  // Extract video ID from YouTube URL
  const getVideoId = (url: string) => {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Generate a simple title from video ID
  const generateTitle = (videoId: string) => {
    return `YouTube Video ${videoId}`;
  };

  const handleSubmit = async () => {
    if (!supabaseClient) {
      toast({
        title: "Error",
        description: "Application not properly initialized. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    if (!isValidYoutubeUrl(url)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube URL",
        variant: "destructive",
      });
      return;
    }

    if (!isChecked) {
      toast({
        title: "Terms Required",
        description: "Please agree to the terms and conditions",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Get the current session
      const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
      
      console.log('🔍 Session check:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        error: sessionError?.message
      });

      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error("Authentication error: " + sessionError.message);
      }

      if (!session?.user?.id) {
        console.error('No valid session found');
        throw new Error("Authentication required");
      }

      // Verify user exists in public.users
      const { data: publicUser, error: publicUserError } = await supabaseClient
        .from('users')
        .select('id')
        .eq('id', session.user.id)
        .single();

      console.log('🔍 User check:', {
        userFound: !!publicUser,
        error: publicUserError?.message
      });

      if (publicUserError || !publicUser) {
        console.error('User not found in public.users:', publicUserError);
        // Try to create the user record
        const { error: createError } = await supabaseClient
          .from('users')
          .insert({
            id: session.user.id,
            email: session.user.email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (createError) {
          console.error('Failed to create user record:', createError);
          throw new Error("User account not properly set up. Please log out and log in again.");
        }
      }

      // Get video ID
      const videoId = getVideoId(url);
      if (!videoId) {
        throw new Error("Invalid YouTube URL");
      }

      const title = generateTitle(videoId);

      console.log('📝 Attempting document creation:', {
        userId: session.user.id,
        videoId,
        title
      });

      // Create a new document
      const { data: document, error: insertError } = await supabaseClient
        .from("documents")
        .insert({
          user_id: session.user.id,
          video_title: title,
          video_url: url,
          status: "pending",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          title: title,
          video_duration: 0,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details
        });
        
        if (insertError.code === '23503') { // Foreign key violation
          console.error('User ID not found in auth.users. Please ensure you are properly logged in.');
          throw new Error("Authentication error: Please log out and log in again.");
        }
        throw new Error(insertError.message);
      }

      if (!document) {
        throw new Error("Failed to create document");
      }

      toast({
        title: "Success!",
        description: "Your document is being created...",
      });

      // Redirect to the document page
      router.push(`/documents/${document.id}`);
      router.refresh();
    } catch (error) {
      console.error('Error creating document:', error);
      
      if (error instanceof Error) {
        if (error.message === "Authentication required" || error.message.includes("Authentication error")) {
          // Store the current path and redirect to login
          const currentPath = window.location.pathname;
          router.push(`/login?returnTo=${encodeURIComponent(currentPath)}`);
          return;
        }
      }

      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="video-url">YouTube Video URL</Label>
        <Input
          id="video-url"
          type="url"
          placeholder="https://www.youtube.com/watch?v=..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full"
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="terms"
          checked={isChecked}
          onCheckedChange={(checked) => setIsChecked(checked as boolean)}
        />
        <Label htmlFor="terms" className="text-sm">
          I agree to the terms and conditions of HowToBuddy
        </Label>
      </div>

      <Button
        className="w-full"
        onClick={handleSubmit}
        disabled={!url || !isValidYoutubeUrl(url) || !isChecked || isLoading || !supabaseClient}
      >
        {isLoading ? "Creating document..." : "Create Document"}
      </Button>
    </div>
  );
} 