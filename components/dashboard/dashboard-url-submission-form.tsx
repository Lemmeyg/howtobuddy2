"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { getSupabaseClient } from "@/lib/supabase/singleton";

export function DashboardUrlSubmissionForm() {
  const [url, setUrl] = useState("");
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = getSupabaseClient();

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
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error("Authentication required");
      }

      // Get video ID
      const videoId = getVideoId(url);
      if (!videoId) {
        throw new Error("Invalid YouTube URL");
      }

      const title = generateTitle(videoId);

      // Create a new document
      const { data: document, error: insertError } = await supabase
        .from("documents")
        .insert({
          user_id: session.user.id,
          video_title: title,
          video_url: url,
          status: "pending",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          title: title,
          video_duration: 0, // Default value, will be updated after processing
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        if (insertError.code === '23502') {
          throw new Error("Missing required fields. Please try again.");
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
      router.refresh(); // Refresh the current page data
    } catch (error) {
      console.error('Error creating document:', error);
      
      if (error instanceof Error) {
        if (error.message === "Authentication required") {
          router.push('/login');
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
        disabled={!url || !isValidYoutubeUrl(url) || !isChecked || isLoading}
      >
        {isLoading ? "Creating document..." : "Create Document"}
      </Button>
    </div>
  );
} 