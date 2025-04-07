"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

export function UrlSubmissionForm() {
  const [url, setUrl] = useState("");
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const isValidYoutubeUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    return youtubeRegex.test(url);
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

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      // Create a new document
      const { data: document, error } = await supabase
        .from("documents")
        .insert({
          user_id: session.user.id,
          title: "New Document", // This will be updated with the video title
          video_url: url,
          status: "processing",
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your document is being created...",
      });

      // Redirect to the document page
      router.push(`/documents/${document.id}`);
      router.refresh(); // Refresh the current page data
    } catch (error) {
      console.error('Error creating document:', error);
      toast({
        title: "Error",
        description: "Failed to create document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isSubmitDisabled = !url || !isChecked || !isValidYoutubeUrl(url);

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
        disabled={isSubmitDisabled || isLoading}
      >
        {isLoading ? "Creating document..." : "Create Document"}
      </Button>
    </div>
  );
} 