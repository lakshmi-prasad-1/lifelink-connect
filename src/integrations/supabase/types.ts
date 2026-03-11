export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      blood_banks: {
        Row: {
          a_neg: number | null
          a_pos: number | null
          ab_neg: number | null
          ab_pos: number | null
          b_neg: number | null
          b_pos: number | null
          contact_phone: string | null
          created_at: string
          email: string | null
          id: string
          last_updated: string | null
          latitude: number | null
          location: string
          longitude: number | null
          name: string
          o_neg: number | null
          o_pos: number | null
        }
        Insert: {
          a_neg?: number | null
          a_pos?: number | null
          ab_neg?: number | null
          ab_pos?: number | null
          b_neg?: number | null
          b_pos?: number | null
          contact_phone?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_updated?: string | null
          latitude?: number | null
          location: string
          longitude?: number | null
          name: string
          o_neg?: number | null
          o_pos?: number | null
        }
        Update: {
          a_neg?: number | null
          a_pos?: number | null
          ab_neg?: number | null
          ab_pos?: number | null
          b_neg?: number | null
          b_pos?: number | null
          contact_phone?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_updated?: string | null
          latitude?: number | null
          location?: string
          longitude?: number | null
          name?: string
          o_neg?: number | null
          o_pos?: number | null
        }
        Relationships: []
      }
      blood_requests: {
        Row: {
          blood_group: string
          contact_phone: string | null
          created_at: string
          hospital_latitude: number | null
          hospital_location: string
          hospital_longitude: number | null
          hospital_name: string
          id: string
          notes: string | null
          patient_name: string
          requester_id: string
          status: string
          units_needed: number
          updated_at: string
          urgency: string
        }
        Insert: {
          blood_group: string
          contact_phone?: string | null
          created_at?: string
          hospital_latitude?: number | null
          hospital_location: string
          hospital_longitude?: number | null
          hospital_name: string
          id?: string
          notes?: string | null
          patient_name: string
          requester_id: string
          status?: string
          units_needed?: number
          updated_at?: string
          urgency?: string
        }
        Update: {
          blood_group?: string
          contact_phone?: string | null
          created_at?: string
          hospital_latitude?: number | null
          hospital_location?: string
          hospital_longitude?: number | null
          hospital_name?: string
          id?: string
          notes?: string | null
          patient_name?: string
          requester_id?: string
          status?: string
          units_needed?: number
          updated_at?: string
          urgency?: string
        }
        Relationships: []
      }
      camp_registrations: {
        Row: {
          camp_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          camp_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          camp_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "camp_registrations_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "donation_camps"
            referencedColumns: ["id"]
          },
        ]
      }
      donation_camps: {
        Row: {
          camp_date: string
          contact_phone: string | null
          created_at: string
          current_registrations: number | null
          description: string | null
          end_time: string | null
          id: string
          latitude: number | null
          location: string
          longitude: number | null
          max_registrations: number | null
          name: string
          organizer: string
          start_time: string | null
        }
        Insert: {
          camp_date: string
          contact_phone?: string | null
          created_at?: string
          current_registrations?: number | null
          description?: string | null
          end_time?: string | null
          id?: string
          latitude?: number | null
          location: string
          longitude?: number | null
          max_registrations?: number | null
          name: string
          organizer: string
          start_time?: string | null
        }
        Update: {
          camp_date?: string
          contact_phone?: string | null
          created_at?: string
          current_registrations?: number | null
          description?: string | null
          end_time?: string | null
          id?: string
          latitude?: number | null
          location?: string
          longitude?: number | null
          max_registrations?: number | null
          name?: string
          organizer?: string
          start_time?: string | null
        }
        Relationships: []
      }
      donations: {
        Row: {
          blood_bank_id: string | null
          created_at: string
          donation_date: string
          donor_id: string
          id: string
          request_id: string | null
          units: number
          verification_code: string | null
          verified: boolean
        }
        Insert: {
          blood_bank_id?: string | null
          created_at?: string
          donation_date?: string
          donor_id: string
          id?: string
          request_id?: string | null
          units?: number
          verification_code?: string | null
          verified?: boolean
        }
        Update: {
          blood_bank_id?: string | null
          created_at?: string
          donation_date?: string
          donor_id?: string
          id?: string
          request_id?: string | null
          units?: number
          verification_code?: string | null
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "donations_blood_bank_id_fkey"
            columns: ["blood_bank_id"]
            isOneToOne: false
            referencedRelation: "blood_banks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "donors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "blood_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      donors: {
        Row: {
          availability: string
          badge: string | null
          blood_group: string
          city: string
          created_at: string
          email: string
          full_name: string
          id: string
          last_donation_date: string | null
          latitude: number | null
          longitude: number | null
          phone: string
          points: number
          total_donations: number
          updated_at: string
          user_id: string
        }
        Insert: {
          availability?: string
          badge?: string | null
          blood_group: string
          city: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          last_donation_date?: string | null
          latitude?: number | null
          longitude?: number | null
          phone: string
          points?: number
          total_donations?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          availability?: string
          badge?: string | null
          blood_group?: string
          city?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          last_donation_date?: string | null
          latitude?: number | null
          longitude?: number | null
          phone?: string
          points?: number
          total_donations?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      donor_matches: {
        Row: {
          created_at: string
          donor_id: string
          id: string
          request_id: string
          status: string
        }
        Insert: {
          created_at?: string
          donor_id: string
          id?: string
          request_id: string
          status: string
        }
        Update: {
          created_at?: string
          donor_id?: string
          id?: string
          request_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "donor_matches_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "donors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donor_matches_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "blood_requests"
            referencedColumns: ["id"]
          }
        ]
      }
      emergency_posts: {
        Row: {
          blood_group: string | null
          contact_phone: string | null
          created_at: string
          description: string
          id: string
          location: string | null
          post_type: string
          status: string
          title: string
          updated_at: string
          urgency: string
          user_id: string
        }
        Insert: {
          blood_group?: string | null
          contact_phone?: string | null
          created_at?: string
          description: string
          id?: string
          location?: string | null
          post_type: string
          status?: string
          title: string
          updated_at?: string
          urgency?: string
          user_id: string
        }
        Update: {
          blood_group?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string
          id?: string
          location?: string | null
          post_type?: string
          status?: string
          title?: string
          updated_at?: string
          urgency?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
