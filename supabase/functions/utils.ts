
// Helper RPC functions for follows and other operations
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
      profiles: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          is_premium: boolean | null
          is_squad_creator: boolean | null
          stripe_customer_id: string | null
          full_name: string | null
          bio: string | null
          website: string | null
          is_active: boolean | null
          is_moderator: boolean | null
          is_admin: boolean | null
          heaven_points: number | null
          created_at: string
          updated_at: string
        }
      }
      user_subscriptions: {
        Row: {
          id: string
          user_id: string
          subscription_type: string
          subscription_tier: string
          is_active: boolean
          started_at: string
          expires_at: string
          cancelled_at: string | null
          stripe_subscription_id: string | null
          last_payment_at: string
        }
      }
      post_boosts: {
        Row: {
          id: string
          post_id: number
          user_id: string
          created_at: string
          expires_at: string
          is_active: boolean
        }
      }
      posts: {
        Row: {
          id: number
          title: string
          content: string
          author_id: string
          is_boosted: boolean | null
          image: string | null
          upvotes: number | null
          downvotes: number | null
          commentcount: number | null
          created_at: string
          updated_at: string
          squad_id: number | null
          is_announcement: boolean | null
          is_hidden: boolean | null
          is_flagged: boolean | null
          report_count: number | null
          view_count: number | null
        }
      }
      system_bots: {
        Row: {
          id: number
          name: string
          description: string | null
          type: string
          is_active: boolean
          prompt_template: string | null
          schedule: string
          last_run: string | null
          created_at: string
          created_by: string
        }
      }
      messages: {
        Row: {
          id: number
          sender_id: string
          receiver_id: string
          content: string
          read: boolean
          created_at: string
        }
      }
      notifications: {
        Row: {
          id: number
          user_id: string
          content: string
          seen: boolean
          type: string
          created_at: string
        }
      }
    }
    Functions: {
      check_is_following: {
        Args: { follower_user_id: string; followed_user_id: string }
        Returns: boolean
      }
      count_followers: {
        Args: { user_id: string }
        Returns: number
      }
      count_following: {
        Args: { user_id: string }
        Returns: number
      }
      follow_user: {
        Args: { follower_user_id: string; followed_user_id: string }
        Returns: undefined
      }
      unfollow_user: {
        Args: { follower_user_id: string; followed_user_id: string }
        Returns: undefined
      }
    }
  }
}
