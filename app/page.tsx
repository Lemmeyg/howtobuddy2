import { redirect } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = createSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  // If we have a session, redirect to dashboard
  if (session) {
    redirect("/dashboard");
  }

  // If no session, redirect to login
  redirect("/login");
} 