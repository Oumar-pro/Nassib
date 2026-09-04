/**
 * Exact Supabase / PostgreSQL Database Schema Definitions
 * Fully aligned with the production database schema.
 */

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
      profiles: {
        Row: {
          id: string; // uuid
          created_at: string; // timestamptz
          updated_at: string; // timestamptz
          user_id: string; // uuid UNIQUE -> auth.users(id)
          name: string; // text NOT NULL
          age: number; // integer NOT NULL CHECK (age >= 18 AND age <= 100)
          profession: string | null; // text
          city: string; // text NOT NULL
          marital_status: string; // text NOT NULL
          religion: string | null; // text DEFAULT 'Sunnite'
          education: string | null; // text
          match_percentage: number | null; // integer DEFAULT 85
          is_verified_nni: boolean | null; // boolean DEFAULT false
          is_wali_approved: boolean | null; // boolean DEFAULT false
          is_premium: boolean | null; // boolean DEFAULT false
          photo_url: string | null; // text
          photo_private: boolean | null; // boolean DEFAULT false
          bio: string | null; // text
          wali_reference: string | null; // text
          gender: 'male' | 'female' | null; // text CHECK (gender IN ('male', 'female'))
          views_count: number | null; // integer DEFAULT 0
          likes_count: number | null; // integer DEFAULT 0
          hobbies: string | null; // text
          interests: string | null; // text
          drinks_alcohol: boolean | null; // boolean
          smokes: boolean | null; // boolean
          presentation: string | null; // text
          personality: string | null; // text
          family_importance: string | null; // text
          is_admin: boolean | null; // boolean DEFAULT false
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id: string;
          name: string;
          age: number;
          profession?: string | null;
          city: string;
          marital_status: string;
          religion?: string | null;
          education?: string | null;
          match_percentage?: number | null;
          is_verified_nni?: boolean | null;
          is_wali_approved?: boolean | null;
          is_premium?: boolean | null;
          photo_url?: string | null;
          photo_private?: boolean | null;
          bio?: string | null;
          wali_reference?: string | null;
          gender?: 'male' | 'female' | null;
          views_count?: number | null;
          likes_count?: number | null;
          hobbies?: string | null;
          interests?: string | null;
          drinks_alcohol?: boolean | null;
          smokes?: boolean | null;
          presentation?: string | null;
          personality?: string | null;
          family_importance?: string | null;
          is_admin?: boolean | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
          name?: string;
          age?: number;
          profession?: string | null;
          city?: string;
          marital_status?: string;
          religion?: string | null;
          education?: string | null;
          match_percentage?: number | null;
          is_verified_nni?: boolean | null;
          is_wali_approved?: boolean | null;
          is_premium?: boolean | null;
          photo_url?: string | null;
          photo_private?: boolean | null;
          bio?: string | null;
          wali_reference?: string | null;
          gender?: 'male' | 'female' | null;
          views_count?: number | null;
          likes_count?: number | null;
          hobbies?: string | null;
          interests?: string | null;
          drinks_alcohol?: boolean | null;
          smokes?: boolean | null;
          presentation?: string | null;
          personality?: string | null;
          family_importance?: string | null;
          is_admin?: boolean | null;
        };
      };

      conversations: {
        Row: {
          id: string; // uuid
          created_at: string; // timestamptz
          updated_at: string; // timestamptz
          candidate_id: string; // uuid -> profiles(id)
          suitor_id: string; // uuid -> profiles(id)
          last_message: string | null; // text
          last_message_time: string | null; // timestamptz
          is_supervised: boolean | null; // boolean DEFAULT true
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          candidate_id: string;
          suitor_id: string;
          last_message?: string | null;
          last_message_time?: string | null;
          is_supervised?: boolean | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          candidate_id?: string;
          suitor_id?: string;
          last_message?: string | null;
          last_message_time?: string | null;
          is_supervised?: boolean | null;
        };
      };

      messages: {
        Row: {
          id: string; // uuid
          created_at: string; // timestamptz
          conversation_id: string | null; // uuid -> conversations(id)
          sender_id: string; // uuid -> profiles(id)
          sender_name: string; // text
          sender_avatar: string | null; // text
          text: string; // text
          is_supervised: boolean | null; // boolean DEFAULT true
          status: 'sent' | 'delivered' | 'read' | null; // text DEFAULT 'sent'
        };
        Insert: {
          id?: string;
          created_at?: string;
          conversation_id?: string | null;
          sender_id: string;
          sender_name: string;
          sender_avatar?: string | null;
          text: string;
          is_supervised?: boolean | null;
          status?: 'sent' | 'delivered' | 'read' | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          conversation_id?: string | null;
          sender_id?: string;
          sender_name?: string;
          sender_avatar?: string | null;
          text?: string;
          is_supervised?: boolean | null;
          status?: 'sent' | 'delivered' | 'read' | null;
        };
      };

      pricing_plans: {
        Row: {
          id: string; // text PRIMARY KEY
          name: string; // text
          price: string; // text
          period: string; // text
          description: string | null; // text
          features: Json | null; // jsonb
          popular: boolean | null; // boolean DEFAULT false
          cta_text: string | null; // text
        };
        Insert: {
          id: string;
          name: string;
          price: string;
          period: string;
          description?: string | null;
          features?: Json | null;
          popular?: boolean | null;
          cta_text?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          price?: string;
          period?: string;
          description?: string | null;
          features?: Json | null;
          popular?: boolean | null;
          cta_text?: string | null;
        };
      };

      user_favorites: {
        Row: {
          id: string; // uuid PRIMARY KEY
          user_id: string; // uuid -> auth.users(id)
          profile_id: string; // uuid -> profiles(id)
          created_at: string | null; // timestamptz
        };
        Insert: {
          id?: string;
          user_id: string;
          profile_id: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          profile_id?: string;
          created_at?: string | null;
        };
      };

      user_roles: {
        Row: {
          user_id: string; // uuid PRIMARY KEY -> auth.users(id)
          role: 'user' | 'admin'; // text DEFAULT 'user'
          created_at: string; // timestamptz
        };
        Insert: {
          user_id: string;
          role?: 'user' | 'admin';
          created_at?: string;
        };
        Update: {
          user_id?: string;
          role?: 'user' | 'admin';
          created_at?: string;
        };
      };

      profile_private: {
        Row: {
          profile_id: string; // uuid PRIMARY KEY -> profiles(id)
          user_id: string; // uuid UNIQUE -> auth.users(id)
          wali_reference: string | null; // text
          nni_status: 'pending' | 'submitted' | 'verified' | 'rejected'; // text DEFAULT 'pending'
          wali_status: 'pending' | 'submitted' | 'approved' | 'rejected'; // text DEFAULT 'pending'
          nni_verified_at: string | null; // timestamptz
          wali_approved_at: string | null; // timestamptz
          admin_notes: string | null; // text
          created_at: string; // timestamptz
          updated_at: string; // timestamptz
        };
        Insert: {
          profile_id: string;
          user_id: string;
          wali_reference?: string | null;
          nni_status?: 'pending' | 'submitted' | 'verified' | 'rejected';
          wali_status?: 'pending' | 'submitted' | 'approved' | 'rejected';
          nni_verified_at?: string | null;
          wali_approved_at?: string | null;
          admin_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          profile_id?: string;
          user_id?: string;
          wali_reference?: string | null;
          nni_status?: 'pending' | 'submitted' | 'verified' | 'rejected';
          wali_status?: 'pending' | 'submitted' | 'approved' | 'rejected';
          nni_verified_at?: string | null;
          wali_approved_at?: string | null;
          admin_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      verification_requests: {
        Row: {
          id: string; // uuid PRIMARY KEY
          profile_id: string; // uuid -> profiles(id)
          user_id: string; // uuid -> auth.users(id)
          verification_type: 'nni' | 'wali'; // text
          status: 'pending' | 'under_review' | 'approved' | 'rejected'; // text DEFAULT 'pending'
          document_path: string | null; // text
          submitted_at: string; // timestamptz
          reviewed_at: string | null; // timestamptz
          reviewed_by: string | null; // uuid -> auth.users(id)
          admin_note: string | null; // text
          created_at: string; // timestamptz
          updated_at: string; // timestamptz
        };
        Insert: {
          id?: string;
          profile_id: string;
          user_id: string;
          verification_type: 'nni' | 'wali';
          status?: 'pending' | 'under_review' | 'approved' | 'rejected';
          document_path?: string | null;
          submitted_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          admin_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          user_id?: string;
          verification_type?: 'nni' | 'wali';
          status?: 'pending' | 'under_review' | 'approved' | 'rejected';
          document_path?: string | null;
          submitted_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          admin_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      admin_audit_logs: {
        Row: {
          id: string; // uuid PRIMARY KEY
          admin_user_id: string | null; // uuid -> auth.users(id)
          action: string; // text NOT NULL
          target_type: string | null; // text
          target_id: string | null; // uuid
          details: Json | null; // jsonb DEFAULT '{}'
          ip_address: string | null; // inet
          created_at: string; // timestamptz
        };
        Insert: {
          id?: string;
          admin_user_id?: string | null;
          action: string;
          target_type?: string | null;
          target_id?: string | null;
          details?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_user_id?: string | null;
          action?: string;
          target_type?: string | null;
          target_id?: string | null;
          details?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
      };

      user_blocks: {
        Row: {
          id: string; // uuid PRIMARY KEY
          blocker_user_id: string; // uuid -> auth.users(id)
          blocked_user_id: string; // uuid -> auth.users(id)
          reason: string | null; // text
          created_at: string; // timestamptz
        };
        Insert: {
          id?: string;
          blocker_user_id: string;
          blocked_user_id: string;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          blocker_user_id?: string;
          blocked_user_id?: string;
          reason?: string | null;
          created_at?: string;
        };
      };

      user_reports: {
        Row: {
          id: string; // uuid PRIMARY KEY
          reporter_user_id: string; // uuid -> auth.users(id)
          reported_user_id: string; // uuid -> auth.users(id)
          reason: string; // text NOT NULL
          description: string | null; // text
          status: 'pending' | 'reviewing' | 'resolved' | 'dismissed'; // text DEFAULT 'pending'
          admin_note: string | null; // text
          reviewed_by: string | null; // uuid -> auth.users(id)
          reviewed_at: string | null; // timestamptz
          created_at: string; // timestamptz
          updated_at: string; // timestamptz
        };
        Insert: {
          id?: string;
          reporter_user_id: string;
          reported_user_id: string;
          reason: string;
          description?: string | null;
          status?: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
          admin_note?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reporter_user_id?: string;
          reported_user_id?: string;
          reason?: string;
          description?: string | null;
          status?: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
          admin_note?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      profile_photos: {
        Row: {
          id: string; // uuid PRIMARY KEY DEFAULT gen_random_uuid()
          profile_id: string; // uuid -> profiles(id)
          user_id: string; // uuid -> auth.users(id)
          storage_path: string; // text NOT NULL
          sort_order: number; // integer NOT NULL DEFAULT 0
          is_primary: boolean; // boolean NOT NULL DEFAULT false
          created_at: string; // timestamptz NOT NULL DEFAULT now()
        };
        Insert: {
          id?: string;
          profile_id: string;
          user_id: string;
          storage_path: string;
          sort_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          user_id?: string;
          storage_path?: string;
          sort_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
      };

      reports: {
        Row: {
          id: string; // uuid PRIMARY KEY
          created_at: string; // timestamptz
          reporter_user_id: string | null; // uuid -> auth.users(id)
          reported_profile_id: string; // uuid -> profiles(id)
          reason: string; // text NOT NULL
          status: 'pending' | 'reviewed' | 'dismissed' | null; // text DEFAULT 'pending'
        };
        Insert: {
          id?: string;
          created_at?: string;
          reporter_user_id?: string | null;
          reported_profile_id: string;
          reason: string;
          status?: 'pending' | 'reviewed' | 'dismissed' | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          reporter_user_id?: string | null;
          reported_profile_id?: string;
          reason?: string;
          status?: 'pending' | 'reviewed' | 'dismissed' | null;
        };
      };
    };
  };
}

export type DbProfile = Database['public']['Tables']['profiles']['Row'];
export type DbConversation = Database['public']['Tables']['conversations']['Row'];
export type DbMessage = Database['public']['Tables']['messages']['Row'];
export type DbPricingPlan = Database['public']['Tables']['pricing_plans']['Row'];
export type DbUserFavorite = Database['public']['Tables']['user_favorites']['Row'];
export type DbUserRole = Database['public']['Tables']['user_roles']['Row'];
export type DbProfilePrivate = Database['public']['Tables']['profile_private']['Row'];
export type DbVerificationRequest = Database['public']['Tables']['verification_requests']['Row'];
export type DbAdminAuditLog = Database['public']['Tables']['admin_audit_logs']['Row'];
export type DbUserBlock = Database['public']['Tables']['user_blocks']['Row'];
export type DbUserReport = Database['public']['Tables']['user_reports']['Row'];
export type DbProfilePhoto = Database['public']['Tables']['profile_photos']['Row'];
export type DbReport = Database['public']['Tables']['reports']['Row'];
