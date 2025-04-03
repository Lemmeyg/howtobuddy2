export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          content: string | null
          status: 'processing' | 'completed' | 'error'
          user_id: string
          video_title: string | null
          video_duration: number | null
          error_message: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          content?: string | null
          status?: 'processing' | 'completed' | 'error'
          user_id: string
          video_title?: string | null
          video_duration?: number | null
          error_message?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          content?: string | null
          status?: 'processing' | 'completed' | 'error'
          user_id?: string
          video_title?: string | null
          video_duration?: number | null
          error_message?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 