
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import PostCard from '@/components/PostCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Separator } from '@/components/ui/separator';
import { useFeedAlgorithm } from '@/hooks/useFeedAlgorithm';
import { Skeleton } from '@/components/ui/skeleton';
import CreatePostCard from '@/components/CreatePostCard';
import { PostWithAuthor } from '@/types/supabase-custom';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface FeedProps {
  initialTab?: string;
}

const Feed = () => {
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('for-you');
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const { user } = useAuth();
  const { rankPosts } = useFeedAlgorithm();
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchPosts = useCallback(async (tab: string, page: number) => {
    setLoading(true);
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles:author_id(username, avatar_url),
          squads:squad_id(name)
        `)
        .order('created_at', { ascending: false })
        .range((page - 1) * 10, page * 10 - 1);

      if (tab === 'following' && user) {
        // Check if squad_members table exists
        const { data: userSquads, error: squadError } = await supabase
          .from('squad_members')
          .select('squad_id')
          .eq('user_id', user.id);

        if (squadError) {
          console.error("Error fetching user squads:", squadError);
          toast({
            title: "Error fetching content",
            description: "There was an issue loading the feed. Please try again.",
            variant: "destructive"
          });
        } else if (userSquads && userSquads.length > 0) {
          // User is in some squads, show posts from those squads
          const squadIds = userSquads.map(squad => squad.squad_id);
          query = query.in('squad_id', squadIds);
        } else {
          // User isn't in any squads, show an empty feed
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
            profiles:author_id(username, avatar_url),
            squads:squad_id(name)
          `)
          .order('upvotes', { ascending: false })
          .range((page - 1) * 10, page * 10 - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching posts:", error);
        toast({
          title: "Error fetching content",
          description: "There was an issue loading the feed. Please try again.",
          variant: "destructive"
        });
      } else {
        const newPosts = data as unknown as PostWithAuthor[] || [];
        setPosts(prevPosts => page === 1 ? newPosts : [...prevPosts, ...newPosts]);
        setHasMore(newPosts.length === 10);
      }
    } catch (error) {
      console.error("Error in fetchPosts:", error);
      toast({
        title: "Error fetching content",
        description: "There was an issue loading the feed. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
    fetchPosts(activeTab, 1);
  }, [activeTab, fetchPosts]);

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

  const renderFeed = (posts: PostWithAuthor[]) => {
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

  const navigateToTab = (route: string) => {
    navigate(route);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-6">
        <CreatePostCard onPostCreated={() => refreshFeed()} />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 w-full justify-start">
          <TabsTrigger value="for-you" onClick={() => navigateToTab("/")}>For You</TabsTrigger>
          <TabsTrigger value="following" onClick={() => navigateToTab("/following")}>Following</TabsTrigger>
          <TabsTrigger value="trending" onClick={() => navigateToTab("/trending")}>Trending</TabsTrigger>
          <TabsTrigger value="latest" onClick={() => navigateToTab("/latest")}>Latest</TabsTrigger>
        </TabsList>
        
        <TabsContent value="for-you">
          {renderFeed(posts)}
        </TabsContent>
        
        <TabsContent value="following">
          {renderFeed(posts)}
        </TabsContent>
        
        <TabsContent value="trending">
          {renderFeed(posts)}
        </TabsContent>
        
        <TabsContent value="latest">
          {renderFeed(posts)}
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
