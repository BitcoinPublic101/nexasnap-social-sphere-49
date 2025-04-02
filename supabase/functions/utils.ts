
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
      // Define your tables here based on your schema
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
