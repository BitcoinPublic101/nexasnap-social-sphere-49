export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bookmarks: {
        Row: {
          created_at: string
          id: number
          post_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          post_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          post_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          downvotes: number | null
          id: number
          is_hidden: boolean | null
          parent_id: number | null
          post_id: number
          updated_at: string
          upvotes: number | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          downvotes?: number | null
          id?: number
          is_hidden?: boolean | null
          parent_id?: number | null
          post_id: number
          updated_at?: string
          upvotes?: number | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          downvotes?: number | null
          id?: number
          is_hidden?: boolean | null
          parent_id?: number | null
          post_id?: number
          updated_at?: string
          upvotes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      content_reports: {
        Row: {
          content_id: number
          content_type: string
          created_at: string
          id: number
          reason: string
          reporter_id: string
          status: string
          updated_at: string
        }
        Insert: {
          content_id: number
          content_type: string
          created_at?: string
          id?: number
          reason: string
          reporter_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          content_id?: number
          content_type?: string
          created_at?: string
          id?: number
          reason?: string
          reporter_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      files: {
        Row: {
          content_type: string
          created_at: string
          filename: string
          id: string
          size: number
          updated_at: string
          user_id: string
          wasabi_key: string
          wasabi_url: string
        }
        Insert: {
          content_type: string
          created_at?: string
          filename: string
          id?: string
          size: number
          updated_at?: string
          user_id: string
          wasabi_key: string
          wasabi_url: string
        }
        Update: {
          content_type?: string
          created_at?: string
          filename?: string
          id?: string
          size?: number
          updated_at?: string
          user_id?: string
          wasabi_key?: string
          wasabi_url?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          author_id: string
          commentcount: number | null
          content: string
          created_at: string
          downvotes: number | null
          id: number
          image: string | null
          is_announcement: boolean | null
          is_flagged: boolean | null
          is_hidden: boolean | null
          report_count: number | null
          squad_id: number | null
          title: string
          updated_at: string
          upvotes: number | null
          view_count: number | null
        }
        Insert: {
          author_id: string
          commentcount?: number | null
          content: string
          created_at?: string
          downvotes?: number | null
          id?: number
          image?: string | null
          is_announcement?: boolean | null
          is_flagged?: boolean | null
          is_hidden?: boolean | null
          report_count?: number | null
          squad_id?: number | null
          title: string
          updated_at?: string
          upvotes?: number | null
          view_count?: number | null
        }
        Update: {
          author_id?: string
          commentcount?: number | null
          content?: string
          created_at?: string
          downvotes?: number | null
          id?: number
          image?: string | null
          is_announcement?: boolean | null
          is_flagged?: boolean | null
          is_hidden?: boolean | null
          report_count?: number | null
          squad_id?: number | null
          title?: string
          updated_at?: string
          upvotes?: number | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string | null
          heaven_points: number | null
          id: string
          is_active: boolean | null
          is_admin: boolean | null
          is_moderator: boolean | null
          updated_at: string
          username: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          heaven_points?: number | null
          id: string
          is_active?: boolean | null
          is_admin?: boolean | null
          is_moderator?: boolean | null
          updated_at?: string
          username: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          heaven_points?: number | null
          id?: string
          is_active?: boolean | null
          is_admin?: boolean | null
          is_moderator?: boolean | null
          updated_at?: string
          username?: string
          website?: string | null
        }
        Relationships: []
      }
      squad_favorites: {
        Row: {
          created_at: string
          id: number
          squad_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          squad_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          squad_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "squad_favorites_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      squad_members: {
        Row: {
          id: number
          is_moderator: boolean | null
          joined_at: string
          squad_id: number
          user_id: string
        }
        Insert: {
          id?: number
          is_moderator?: boolean | null
          joined_at?: string
          squad_id: number
          user_id: string
        }
        Update: {
          id?: number
          is_moderator?: boolean | null
          joined_at?: string
          squad_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "squad_members_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      squads: {
        Row: {
          banner_image: string | null
          created_at: string
          description: string | null
          id: number
          is_active: boolean | null
          is_verified: boolean | null
          member_count: number | null
          moderator_id: string | null
          name: string
          post_count: number | null
          updated_at: string
        }
        Insert: {
          banner_image?: string | null
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean | null
          is_verified?: boolean | null
          member_count?: number | null
          moderator_id?: string | null
          name: string
          post_count?: number | null
          updated_at?: string
        }
        Update: {
          banner_image?: string | null
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean | null
          is_verified?: boolean | null
          member_count?: number | null
          moderator_id?: string | null
          name?: string
          post_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          description: string | null
          id: number
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: number
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: number
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      votes: {
        Row: {
          created_at: string
          id: number
          is_upvote: boolean
          post_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          is_upvote: boolean
          post_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          is_upvote?: boolean
          post_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
