import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          updated_at: string;
          full_name: string | null;
          avatar_url: string | null;
          subscription_tier: "free" | "premium" | "pro";
          credits: number;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
          updated_at?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: "free" | "premium" | "pro";
          credits?: number;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
          updated_at?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: "free" | "premium" | "pro";
          credits?: number;
        };
      };
      documents: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          created_at: string;
          updated_at: string;
          video_url: string;
          video_title: string;
          video_duration: number;
          status: "processing" | "completed" | "failed";
          error_message: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
          video_url: string;
          video_title: string;
          video_duration: number;
          status?: "processing" | "completed" | "failed";
          error_message?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
          video_url?: string;
          video_title?: string;
          video_duration?: number;
          status?: "processing" | "completed" | "failed";
          error_message?: string | null;
        };
      };
    };
  };
}; 