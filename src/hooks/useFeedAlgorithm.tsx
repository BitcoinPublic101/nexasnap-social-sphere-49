
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { PostWithAuthor, FeedSortOption } from '@/types/supabase-custom';
import { useToast } from '@/hooks/use-toast';

interface UseFeedAlgorithmProps {
  initialSort?: FeedSortOption;
  squadId?: number;
  limit?: number;
}

/**
 * Custom hook for fetching and sorting posts based on different algorithms
 */
export function useFeedAlgorithm({ 
  initialSort = 'trending', 
  squadId, 
  limit = 20 
}: UseFeedAlgorithmProps = {}) {
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<FeedSortOption>(initialSort);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      // Basic query structure
      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles:author_id(username, avatar_url),
          squads:squad_id(name)
        `)
        .eq('is_hidden', false);
      
      // Apply squad filter if specified
      if (squadId) {
        query = query.eq('squad_id', squadId);
      }
      
      // Apply different sorting based on the selected option
      switch (sortOption) {
        case 'new':
          query = query.order('created_at', { ascending: false });
          break;
        
        case 'top':
          // Sort by upvotes - downvotes (net score)
          query = query.order('upvotes', { ascending: false });
          break;
        
        case 'trending':
          // Use a combination of recency and engagement
          query = query.order('upvotes', { ascending: false })
                       .order('commentcount', { ascending: false });
          break;
        
        case 'personalized':
        case 'following':
          if (user) {
            // Personalized feed based on user's preferences
            // First, get squads the user is following
            const { data: userSquads } = await supabase
              .from('squad_members')
              .select('squad_id')
              .eq('user_id', user.id);
            
            if (userSquads && userSquads.length > 0) {
              const squadIds = userSquads.map(s => s.squad_id);
              
              // Prioritize posts from squads the user follows, then recent trending posts
              query = query
                .in('squad_id', squadIds)
                .order('created_at', { ascending: false });
            } else {
              // Fall back to trending if user doesn't follow any squads
              query = query
                .order('upvotes', { ascending: false })
                .order('created_at', { ascending: false });
            }
          } else {
            // Fall back to trending if not logged in
            query = query
              .order('upvotes', { ascending: false })
              .order('created_at', { ascending: false });
          }
          break;
      }
      
      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      const { data, error: fetchError } = await query
        .range(from, to);
      
      if (fetchError) throw fetchError;
      
      // Update posts - for page 1, replace all posts, otherwise append
      if (page === 1) {
        setPosts(data as unknown as PostWithAuthor[] || []);
      } else {
        setPosts(prevPosts => [...prevPosts, ...(data as unknown as PostWithAuthor[] || [])]);
      }
      
      // Check if there are more posts to load
      setHasMore((data || []).length === limit);
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      setError(error.message || 'Failed to load posts');
      toast({
        title: "Error fetching posts",
        description: error.message || 'Failed to load posts',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [sortOption, squadId, user, page, limit, toast]);
  
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);
  
  // Function to calculate a combined rank score for posts
  const rankPosts = (postsToRank: PostWithAuthor[]) => {
    return [...postsToRank].sort((a, b) => {
      // Simple algorithm that combines upvotes, recency, and comment count
      const scoreA = (a.upvotes || 0) + (a.commentcount || 0);
      const scoreB = (b.upvotes || 0) + (b.commentcount || 0);
      return scoreB - scoreA;
    });
  };
  
  return { 
    posts, 
    loading, 
    error, 
    sortOption, 
    changeSort: (newSort: FeedSortOption) => {
      if (newSort !== sortOption) {
        setSortOption(newSort);
        setPage(1); // Reset to first page when changing sort
      }
    }, 
    hasMore, 
    loadMore: () => {
      if (!loading && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    },
    rankPosts,
    refreshFeed: () => {
      setPage(1);
      setPosts([]);
      fetchPosts();
    }
  };
}
