
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PostWithAuthor, FeedSortOption } from '@/types/supabase-custom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface FeedAlgorithmProps {
  initialSort?: FeedSortOption;
  limit?: number;
  squadId?: number;
}

export const useFeedAlgorithm = ({
  initialSort = 'trending',
  limit = 20,
  squadId
}: FeedAlgorithmProps = {}) => {
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [offset, setOffset] = useState<number>(0);
  const [sort, setSort] = useState<FeedSortOption>(initialSort);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPosts = useCallback(async (offsetVal = 0, sortBy = sort) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('posts')
        .select('*, profiles(username, avatar_url), squads(name)')
        .eq('is_hidden', false);
      
      // Apply squad filter if squadId is provided
      if (squadId) {
        query = query.eq('squad_id', squadId);
      }
      
      // Apply sorting based on the selected option
      switch (sortBy) {
        case 'trending':
          query = query.order('upvotes', { ascending: false }).order('commentcount', { ascending: false });
          break;
        case 'new':
          query = query.order('created_at', { ascending: false });
          break;
        case 'top':
          query = query.order('upvotes', { ascending: false });
          break;
        case 'personalized':
          // If user is logged in, show posts from followed users/squads
          if (user) {
            // This would need a more complex query with joins to followed users/squads
            // For now, just sort by trending for personalized
            query = query.order('upvotes', { ascending: false }).order('created_at', { ascending: false });
          } else {
            // Default to trending for non-logged in users
            query = query.order('upvotes', { ascending: false }).order('commentcount', { ascending: false });
          }
          break;
        case 'following':
          // If user is logged in, show posts from followed users/squads
          if (user) {
            // This would need a more complex query with joins to followed users/squads
            // For now, just use simple filters
            query = query.order('created_at', { ascending: false });
          } else {
            // Default to newest for non-logged in users
            query = query.order('created_at', { ascending: false });
          }
          break;
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }
      
      // Apply pagination
      query = query.range(offsetVal, offsetVal + limit - 1);
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching posts:', error);
        throw error;
      }
      
      if (data.length < limit) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
      
      // Cast the data to PostWithAuthor array
      const postsWithAuthor = data as unknown as PostWithAuthor[];
      
      if (offsetVal === 0) {
        // Replace all posts
        setPosts(postsWithAuthor);
      } else {
        // Append to existing posts
        setPosts(prevPosts => [...prevPosts, ...postsWithAuthor]);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load posts. Please try again.',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [sort, limit, squadId, user, toast]);

  useEffect(() => {
    // Reset offset and fetch posts when sort changes
    setOffset(0);
    fetchPosts(0, initialSort);
  }, [initialSort, fetchPosts]);

  const loadMore = async () => {
    if (loading || !hasMore) return;
    
    const newOffset = offset + limit;
    setOffset(newOffset);
    await fetchPosts(newOffset);
  };

  const refreshFeed = async () => {
    setOffset(0);
    await fetchPosts(0);
  };

  const changeSort = async (newSort: FeedSortOption) => {
    setSort(newSort);
    setOffset(0);
    await fetchPosts(0, newSort);
  };

  return {
    posts,
    loading,
    hasMore,
    loadMore,
    refreshFeed,
    changeSort,
    currentSort: sort,
  };
};
