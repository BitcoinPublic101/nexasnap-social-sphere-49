
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

// For select queries that join related data
export interface PostAuthor {
  username: string;
  avatar_url?: string;
}

export interface SquadInfo {
  name: string;
}

// Custom types that extend the database types
export interface PostWithAuthor extends Post {
  profiles: PostAuthor | null;
  squads?: SquadInfo | null;
}

export interface CommentWithAuthor extends Comment {
  profiles: PostAuthor | null;
}

export interface SquadWithModerator extends Squad {
  moderator: Profile | null;
}

// Types for API responses
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

// Fix BotManagement.tsx type issues by extending SystemBot
export interface ExtendedSystemBot extends SystemBot {
  personality?: string; // Add this optional field for compatibility
  avatar_url?: string; // Add this optional field for compatibility
}

// Custom type for feed sort options
export type FeedSortOption = 'trending' | 'new' | 'top' | 'personalized' | 'following';
