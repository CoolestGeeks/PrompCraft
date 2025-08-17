import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          name: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      agents: {
        Row: {
          id: string;
          name: string;
          system_prompt: string;
          config: Json;
          project_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          system_prompt: string;
          config: Json;
          project_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          system_prompt?: string;
          config?: Json;
          project_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agents_project_id_fkey";
            columns: ["project_id"];
            referencedRelation: "projects";
            referencedColumns: ["id"];
          }
        ];
      };
      prompt_versions: {
        Row: {
          id: string;
          prompt: string;
          created_at: string;
          tag?: 'Production' | 'Beta' | 'Test';
          agent_id: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          prompt: string;
          created_at?: string;
          tag?: 'Production' | 'Beta' | 'Test';
          agent_id: string;
          user_id: string;
        };
        Update: {
          id?: string;
          prompt?: string;
          created_at?: string;
          tag?: 'Production' | 'Beta' | 'Test';
          agent_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "prompt_versions_agent_id_fkey";
            columns: ["agent_id"];
            referencedRelation: "agents";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}


const supabaseUrl = 'https://butbioonkfujhdydzhwx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1dGJpb29ua2Z1amhkeWR6aHd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0MzQxMDUsImV4cCI6MjA2NDAxMDEwNX0.wL0NO2DtnkVPiUuai-Fnw5drKFDuQIwm1Ojwgf4xBs0';

export const supabase: SupabaseClient<Database> = createClient<Database>(supabaseUrl, supabaseAnonKey);