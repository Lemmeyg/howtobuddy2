import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { TemplatePreview } from "@/components/template/template-preview";
import { TemplateAnalytics } from "@/components/template/template-analytics";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function TemplatePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { data: template, error } = await supabase
    .from("templates")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", session.user.id)
    .single();

  if (error || !template) {
    notFound();
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{template.name}</h1>
          <p className="text-muted-foreground mt-2">
            Created on {new Date(template.created_at).toLocaleDateString()}
          </p>
        </div>
        <Link href={`/templates/${template.id}/edit`}>
          <Button>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Template
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="preview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="rounded-lg border p-6">
                <h2 className="text-xl font-semibold mb-4">Template Details</h2>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Type
                    </dt>
                    <dd className="mt-1">{template.type}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Status
                    </dt>
                    <dd className="mt-1">
                      {template.is_public ? "Public" : "Private"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Last Updated
                    </dt>
                    <dd className="mt-1">
                      {new Date(template.updated_at).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <div>
              <TemplatePreview template={template} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <TemplateAnalytics template={template} />
        </TabsContent>
      </Tabs>
    </div>
  );
} 