import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Delete user data from profiles table
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", session.user.id);

    if (profileError) {
      console.error("Error deleting profile:", profileError);
      return NextResponse.json(
        { error: "Failed to delete profile" },
        { status: 500 }
      );
    }

    // Delete user data from documents table
    const { error: documentsError } = await supabase
      .from("documents")
      .delete()
      .eq("user_id", session.user.id);

    if (documentsError) {
      console.error("Error deleting documents:", documentsError);
      return NextResponse.json(
        { error: "Failed to delete documents" },
        { status: 500 }
      );
    }

    // Delete user account
    const { error: authError } = await supabase.auth.admin.deleteUser(
      session.user.id
    );

    if (authError) {
      console.error("Error deleting user:", authError);
      return NextResponse.json(
        { error: "Failed to delete account" },
        { status: 500 }
      );
    }

    // Clear auth cookie
    cookies().delete('sb-access-token');
    cookies().delete('sb-refresh-token');

    return NextResponse.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 