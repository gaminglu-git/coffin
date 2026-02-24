/**
 * Supabase Database Types
 *
 * Regenerate with: npx supabase gen types typescript --project-id <ref>
 * Or with linked project: npx supabase gen types typescript --linked
 * Or with DB URL: npx supabase gen types typescript --db-url "postgresql://..."
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      cases: {
        Row: {
          id: string;
          name: string;
          status: string;
          family_pin: string | null;
          wishes: Json | null;
          deceased: Json | null;
          contact: Json | null;
          checklists: Json | null;
          created_at: string;
          updated_at: string;
          position: number | null;
          post_care_generated: boolean | null;
          case_type: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          status?: string;
          family_pin?: string | null;
          wishes?: Json | null;
          deceased?: Json | null;
          contact?: Json | null;
          checklists?: Json | null;
          created_at?: string;
          updated_at?: string;
          position?: number | null;
          post_care_generated?: boolean | null;
          case_type?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["cases"]["Insert"]>;
      };
      tasks: {
        Row: {
          id: string;
          case_id: string | null;
          title: string;
          assignee: string | null;
          assignee_id: string | null;
          due_date: string | null;
          completed: boolean | null;
          created_at: string;
          reminder_at: string | null;
        };
        Insert: {
          id?: string;
          case_id?: string | null;
          title: string;
          assignee?: string | null;
          assignee_id?: string | null;
          due_date?: string | null;
          completed?: boolean | null;
          created_at?: string;
          reminder_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>;
      };
      appointments: {
        Row: {
          id: string;
          case_id: string | null;
          title: string;
          appointment_date: string;
          created_at: string;
          assignee_id: string | null;
          assignee: string | null;
          end_at: string | null;
          reminder_at: string | null;
        };
        Insert: {
          id?: string;
          case_id?: string | null;
          title: string;
          appointment_date: string;
          created_at?: string;
          assignee_id?: string | null;
          assignee?: string | null;
          end_at?: string | null;
          reminder_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["appointments"]["Insert"]>;
      };
      events: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          start_at: string;
          end_at: string;
          location: string | null;
          is_public: boolean;
          recurrence_type: string;
          recurrence_config: Json;
          recurrence_until: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          start_at: string;
          end_at: string;
          location?: string | null;
          is_public?: boolean;
          recurrence_type?: string;
          recurrence_config?: Json;
          recurrence_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
      };
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];
