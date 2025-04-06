import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { TemplateEditor } from "@/components/template/template-editor";
import { notFound } from "next/navigation";

export default async function EditTemplatePage({
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
      <h1 className="text-3xl font-bold mb-8">Edit Template</h1>

      <TemplateEditor
        template={template}
        onSubmit={async (values) => {
          "use server";
          const supabase = createRouteHandlerClient({ cookies });

          const { error } = await supabase
            .from("templates")
            .update({
              name: values.name,
              type: values.type,
              content: values.content,
              is_public: values.is_public,
            })
            .eq("id", params.id)
            .eq("user_id", session.user.id);

          if (error) {
            throw new Error("Failed to update template");
          }
        }}
      />
    </div>
  );
} 