"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Template, TemplateType, renderTemplate } from "@/lib/template";
import { TemplateSelector } from "@/components/template/template-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export default function NewDocumentPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleTemplateSelect = async (template: Template, variables: Record<string, any>) => {
    try {
      const renderedContent = renderTemplate(template.content, variables);
      setContent(renderedContent);
      setSelectedTemplate(template);
      toast({
        title: "Success",
        description: "Template applied successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply template",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const supabase = createRouteHandlerClient({ cookies });
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Not authenticated");
      }

      const { data: document, error } = await supabase
        .from("documents")
        .insert({
          title,
          content,
          video_url: videoUrl,
          user_id: session.user.id,
          template_id: selectedTemplate?.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Document created successfully",
      });

      router.push(`/documents/${document.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create document",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">New Document</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Title
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter document title"
              required
            />
          </div>

          <div>
            <label htmlFor="videoUrl" className="block text-sm font-medium mb-2">
              Video URL
            </label>
            <Input
              id="videoUrl"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Enter YouTube or Vimeo URL"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Template
            </label>
            <TemplateSelector
              onTemplateSelect={handleTemplateSelect}
              type={TemplateType.SUMMARY}
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium mb-2">
              Content
            </label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter document content"
              className="min-h-[300px]"
              required
            />
          </div>
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Document"}
        </Button>
      </form>
    </div>
  );
} 