
import type { Database } from '@/integrations/supabase/types';

// Use type from the generated types file
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Post = Database['public']['Tables']['posts']['Row'];
export type Squad = Database['public']['Tables']['squads']['Row'];
export type Comment = Database['public']['Tables']['comments']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type SquadMember = Database['public']['Tables']['squad_members']['Row'];
export type SystemBot = Database['public']['Tables']['system_bots']['Row'];

// Custom types that extend the database types
export interface PostWithAuthor extends Post {
  profiles?: Profile;
  squads?: Squad;
}

export interface CommentWithAuthor extends Comment {
  profiles?: Profile;
}

export interface SquadWithModerator extends Squad {
  moderator?: Profile;
}

// Types for API responses
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}
