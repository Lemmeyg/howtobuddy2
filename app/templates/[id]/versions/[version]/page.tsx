import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface TemplateVersionPageProps {
  params: {
    id: string;
    version: string;
  };
}

export async function generateMetadata({
  params,
}: TemplateVersionPageProps): Promise<Metadata> {
  const supabase = createClient();

  // Get user session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      title: "Template Version - HowToBuddy",
      description: "View a specific version of a template",
    };
  }

  // Get template
  const { data: template } = await supabase
    .from("templates")
    .select("name")
    .eq("id", params.id)
    .eq("userId", session.user.id)
    .single();

  return {
    title: `Version ${params.version} - ${template?.name || "Template"} - HowToBuddy`,
    description: "View a specific version of a template",
  };
}

export default async function TemplateVersionPage({
  params,
}: TemplateVersionPageProps) {
  const supabase = createClient();

  // Get user session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return null;
  }

  // Parse version number
  const version = parseInt(params.version);
  if (isNaN(version)) {
    return null;
  }

  // Get template version
  const { data: templateVersion } = await supabase
    .from("template_versions")
    .select("*")
    .eq("templateId", params.id)
    .eq("version", version)
    .single();

  if (!templateVersion) {
    return null;
  }

  // Get template
  const { data: template } = await supabase
    .from("templates")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!template) {
    return null;
  }

  return (
    <div className="container py-6">
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/templates/${params.id}/edit`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Version {version}</h1>
            <p className="text-muted-foreground">
              View a specific version of your template.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Version Details</CardTitle>
            <CardDescription>
              Information about this version of the template.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Template Name</Label>
              <p className="text-sm text-muted-foreground">{template.name}</p>
            </div>
            <div>
              <Label>Version</Label>
              <p className="text-sm text-muted-foreground">{version}</p>
            </div>
            <div>
              <Label>Created At</Label>
              <p className="text-sm text-muted-foreground">
                {new Date(templateVersion.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <Label>Variables</Label>
              <div className="flex flex-wrap gap-2">
                {templateVersion.variables.map((variable) => (
                  <Badge key={variable} variant="secondary">
                    {variable}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
            <CardDescription>
              The content of this version of the template.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              {templateVersion.content}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 