import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { TemplateList } from "@/components/template/template-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function TemplatesPage() {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { data: templates, error } = await supabase
    .from("templates")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching templates:", error);
    throw new Error("Failed to fetch templates");
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Templates</h1>
        <Link href="/templates/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Button>
        </Link>
      </div>

      <TemplateList
        templates={templates}
        onDelete={async (id) => {
          "use server";
          const supabase = createRouteHandlerClient({ cookies });
          const { error } = await supabase
            .from("templates")
            .delete()
            .eq("id", id)
            .eq("user_id", session.user.id);

          if (error) {
            throw new Error("Failed to delete template");
          }
        }}
      />
    </div>
  );
} 