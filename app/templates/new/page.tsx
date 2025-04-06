import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { TemplateEditor } from "@/components/template/template-editor";
import { TemplateType } from "@/lib/template";

export default async function NewTemplatePage() {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">New Template</h1>

      <TemplateEditor
        onSubmit={async (values) => {
          "use server";
          const supabase = createRouteHandlerClient({ cookies });

          const { error } = await supabase.from("templates").insert({
            user_id: session.user.id,
            name: values.name,
            type: values.type,
            content: values.content,
            is_public: values.is_public,
          });

          if (error) {
            throw new Error("Failed to create template");
          }
        }}
      />
    </div>
  );
} 