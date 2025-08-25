import { createClient } from '@supabase/supabase-js';

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      prompt_libraries: {
        Row: {
          id: string
          name: string
          user_id: string
          created_at: string
          team_id: string | null
        }
        Insert: {
          id?: string
          name: string
          user_id: string
          created_at?: string
          team_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          user_id?: string
          created_at?: string
          team_id?: string | null
        }
      }
      prompts: {
        Row: {
          id: string
          name: string
          system_prompt: string
          config: Json
          library_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          system_prompt: string
          config: Json
          library_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          system_prompt?: string
          config?: Json
          library_id?: string
          user_id?: string
          created_at?: string
        }
      }
      prompt_versions: {
        Row: {
          id: string
          prompt: string
          created_at: string
          tag: string | null
          prompt_id: string
          user_id: string
        }
        Insert: {
          id?: string
          prompt: string
          created_at?: string
          tag?: string | null
          prompt_id: string
          user_id: string
        }
        Update: {
          id?: string
          prompt?: string
          created_at?: string
          tag?: string | null
          prompt_id?: string
          user_id?: string
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          owner_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string
          created_at?: string
        }
      }
      team_members: {
        Row: {
            id: string
            user_id: string
            team_id: string
            role: "owner" | "editor" | "viewer"
            created_at: string
        }
        Insert: {
            id?: string
            user_id: string
            team_id: string
            role: "owner" | "editor" | "viewer"
            created_at?: string
        }
        Update: {
            id?: string
            user_id?: string
            team_id?: string
            role?: "owner" | "editor" | "viewer"
            created_at?: string
        }
      }
      invites: {
        Row: {
            id: string
            team_id: string
            email: string
            role: "editor" | "viewer"
            invited_by: string
            created_at: string
            accepted: boolean
        }
        Insert: {
            id?: string
            team_id: string
            email: string
            role: "editor" | "viewer"
            invited_by: string
            created_at?: string
            accepted?: boolean
        }
        Update: {
            id?: string
            team_id?: string
            email?: string
            role?: "editor" | "viewer"
            invited_by?: string
            created_at?: string
            accepted?: boolean
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
        setup_new_user: {
            Args: Record<string, unknown>
            Returns: undefined
        }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export const supabaseUrl = 'https://butbioonkfujhdydzhwx.supabase.co';
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1dGJpb29ua2Z1amhkeWR6aHd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0MzQxMDUsImV4cCI6MjA2NDAxMDEwNX0.wL0NO2DtnkVPiUuai-Fnw5drKFDuQIwm1Ojwgf4xBs0';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);