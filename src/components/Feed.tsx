import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import PostCard from '@/components/PostCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Separator } from '@/components/ui/separator';
import { useFeedAlgorithm } from '@/hooks/useFeedAlgorithm';
import { Skeleton } from '@/components/ui/skeleton';
import CreatePostCard from '@/components/CreatePostCard';

interface FeedProps {
  initialTab?: string;
}

const Feed = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('for-you');
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const { user } = useAuth();
  const { rankPosts } = useFeedAlgorithm();

  const fetchPosts = async (tab: string, page: number) => {
    setLoading(true);
    let query = supabase
      .from('posts')
      .select(`
        *,
        profiles (username, avatar_url),
        squads (name)
      `)
      .order('created_at', { ascending: false })
      .range((page - 1) * 10, page * 10 - 1);

    if (tab === 'following' && user) {
      // Fetch IDs of users the current user is following
      const { data: followingData, error: followingError } = await supabase
        .from('follows')
        .select('followed_user_id')
        .eq('follower_user_id', user.id);

      if (followingError) {
        console.error("Error fetching following users:", followingError);
        setLoading(false);
        return;
      }

      const followingIds = followingData?.map(follow => follow.followed_user_id) || [];

      // If the user is following someone, fetch posts from those users
      if (followingIds.length > 0) {
        query = query.in('author_id', followingIds);
      } else {
        // If the user isn't following anyone, return an empty array
        setPosts([]);
        setLoading(false);
        setHasMore(false);
        return;
      }
    }

    if (tab === 'trending') {
      query = supabase
        .from('posts')
        .select(`
          *,
          profiles (username, avatar_url),
          squads (name)
        `)
        .order('upvotes', { ascending: false })
        .range((page - 1) * 10, page * 10 - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching posts:", error);
    } else {
      const newPosts = data || [];
      setPosts((prevPosts) => [...prevPosts, ...newPosts]);
      setHasMore(newPosts.length === 10);
    }
    setLoading(false);
  };

  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
    fetchPosts(activeTab, 1);
  }, [activeTab, user]);

  const loadMorePosts = () => {
    if (!loading && hasMore) {
      setPage((prevPage) => prevPage + 1);
      fetchPosts(activeTab, page + 1);
    }
  };

  const refreshFeed = () => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
    fetchPosts(activeTab, 1);
  };

  // Function to transform posts to ensure they have the correct shape
  const transformPosts = (rawPosts: any[]) => {
    return rawPosts.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      image: post.image,
      upvotes: post.upvotes || 0,
      downvotes: post.downvotes || 0,
      commentcount: post.commentcount || 0,
      created_at: post.created_at,
      author_id: post.author_id,
      squad_id: post.squad_id,
      is_boosted: post.is_boosted,
      profiles: post.profiles || { username: 'Unknown', avatar_url: null },
      squads: post.squads
    }));
  };

  const renderFeed = (posts: any[]) => {
    if (loading && page === 1) {
      return (
        <>
          <Skeleton className="h-40 w-full rounded-md mb-4" />
          <Skeleton className="h-40 w-full rounded-md mb-4" />
          <Skeleton className="h-40 w-full rounded-md mb-4" />
        </>
      );
    }

    if (!loading && posts.length === 0) {
      return <p className="text-center text-gray-500">No posts available.</p>;
    }

    return (
      <>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </>
    );
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPosts([]);
    setPage(1);
    setHasMore(true);
    fetchPosts(tab, 1);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-6">
        <CreatePostCard onPostCreated={() => refreshFeed()} />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 w-full justify-start">
          <TabsTrigger value="for-you">For You</TabsTrigger>
          <TabsTrigger value="following">Following</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="latest">Latest</TabsTrigger>
        </TabsList>
        
        <TabsContent value="for-you">
          {renderFeed(transformPosts(posts))}
        </TabsContent>
        
        <TabsContent value="following">
          {renderFeed(transformPosts(posts))}
        </TabsContent>
        
        <TabsContent value="trending">
          {renderFeed(transformPosts(posts))}
        </TabsContent>
        
        <TabsContent value="latest">
          {renderFeed(transformPosts(posts))}
        </TabsContent>
      </Tabs>
      
      {hasMore && !loading && (
        <div className="flex justify-center mt-6">
          <Button variant="outline" onClick={loadMorePosts}>
            Load More
          </Button>
        </div>
      )}
    </div>
  );
};

export default Feed;
